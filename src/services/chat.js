import OpenAI from "openai";
import { db } from "../config/db.js";
import { embedText } from "../utils/embed.js";
import { development } from "../config/env.js";

const client = new OpenAI({ apiKey: development.OPENAI_API_KEY });


export async function answerQuestion({ docId, question, topK = 6 }) {
  const col = db.collection("rag_chunks");

  if (!docId || !question) {
    return {
      answer: "Missing docId or question.",
      retrievedChunks: [],
      error: "Missing required parameters",
    };
  }
  const docChunksCount = await col.countDocuments({ docId });
  console.log(`Found ${docChunksCount} chunks for docId: ${docId}`);

  if (docChunksCount === 0) {
    const sampleDocIds = await col.distinct("docId", {}, { limit: 5 });
    console.log(`Sample docIds in database:`, sampleDocIds);
    
    return {
      answer: "No chunks found for this document ID. Please verify the docId is correct.",
      retrievedChunks: [],
      error: "No chunks found for docId",
      docId,
      sampleDocIds: sampleDocIds.slice(0, 3), 
    };
  }

  const sampleChunk = await col.findOne({ docId });
  console.log(`Sample chunk found - docId: ${sampleChunk?.docId}, chunkId: ${sampleChunk?.chunkId}, has embedding: ${!!sampleChunk?.embedding}`);

  const qEmbedding = await embedText(question);
  console.log(`Question embedding generated, length: ${qEmbedding.length}`);
  
  let results = [];
  let usedFallback = false;

  try {
    console.log("Attempting vector search with index: rag_embedding_index");
    results = await col.aggregate([
      {
        $vectorSearch: {
          index: "default",
          path: "embedding",
          queryVector: qEmbedding,
          numCandidates: 100,
          limit: topK,
          filter: { docId: docId }, 
        },
      },
      { $project: { text: 1, chunkId: 1, docId: 1, score: { $meta: "vectorSearchScore" } } },
    ]).toArray();
    console.log(`✅ Vector search returned ${results.length} results`);
    
    // If vector search returns no results, use fallback
    if (results.length === 0) {
      console.log("Vector search returned 0 results, using fallback method...");
      usedFallback = true;
      throw new Error("Vector search returned no results");
    }
  } catch (error) {
    console.log(`❌ Vector search failed: ${error.message}`);
      console.log("ERROR: No chunks found even though countDocuments said there were chunks!");
      return {
        answer: "Error retrieving chunks from database.",
        retrievedChunks: [],
        error: "Database query returned no results",
        docId,
        totalChunksInDoc: docChunksCount,
      };

    

  
  }

  if (!results.length) {
    return {
      answer: "No relevant context found for this document.",
      retrievedChunks: [],
      error: "No results found",
      docId,
      totalChunksInDoc: docChunksCount,
    };
  }

  // Format context with chunk references
  const context = results
    .map((r, idx) => `[Reference ${idx + 1}, Chunk ${r.chunkId}]: ${r.text}`)
    .join("\n\n");

    console.log(context)

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: ` ** GIVE ANSWER IN VERY PROFESSIONAL MANNER and always greet in staring in professiional manner ** Answer using ONLY the provided context.
         when using information from the context. If the answer is not in the context, say you don't know.`,
      },
      { role: "user", content: `Context:\n${context}\n\nQuestion:\n${question}` },
    ],
    temperature: 0,
  });


  return {
    answer: completion.choices[0].message.content,
    docId,
    searchMethod: "vector_search",
  };
}


export async function answerQuestionMultiDocs({ docIds, question, topK = 6 }) {
  const col = db.collection("rag_chunks");

  if (!Array.isArray(docIds) || docIds.length === 0 || !question) {
    return {
      answer: "Missing docIds or question.",
      error: "Missing required parameters"
    };
  }


  const totalChunks = await col.countDocuments({
    docId: { $in: docIds }
  });


  if (totalChunks === 0) {
    return {
      answer: "No chunks found for the provided documents.",
      error: "No chunks found",
      docIds
    };
  }


  const qEmbedding = await embedText(question);

  let results = [];

  try {


    results = await col.aggregate([
      {
        $vectorSearch: {
          index: "default",
          path: "embedding",
          queryVector: qEmbedding,
          numCandidates: Math.max(100, docIds.length * 80),
          limit: topK,
          filter: {
            docId: { $in: docIds }
          }
        }
      },
      {
        $project: {
          text: 1,
          chunkId: 1,
          docId: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]).toArray();
  } catch (error) {
    console.error("❌ Vector search failed:", error.message);
    return {
      answer: "Error retrieving information from documents.",
      error: error.message,
      docIds
    };
  }

  if (!results.length) {
    return {
      answer: "No relevant context found in the selected documents.",
      docIds
    };
  }


  const groupedByDoc = results.reduce((acc, r) => {
    acc[r.docId] = acc[r.docId] || [];
    acc[r.docId].push(r);
    return acc;
  }, {});


  const context = Object.entries(groupedByDoc)
    .map(([docId, chunks]) => {
      const text = chunks
        .map(r => `[Chunk ${r.chunkId}]: ${r.text}`)
        .join("\n");
      return `[Document: ${docId}]\n${text}`;
    })
    .join("\n\n");


  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
You are a professional assistant.
Answer using ONLY the provided context.

Rules:
- Do NOT merge facts from different documents
- If documents disagree, say you don't know
- If the answer is not present, say you don't know
- Maintain a professional tone and greeting
        `
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${question}`
      }
    ]
  });

  return {
    answer: completion.choices[0].message.content,
    docIds,
    sources: Object.keys(groupedByDoc),
    totalChunksConsidered: results.length,
    searchMethod: "vector_search_multi_doc"
  };
}