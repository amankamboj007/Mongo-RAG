import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { v4 as uuidv4 } from "uuid";
import { embedText } from "../utils/embed.js";
import { db } from "../config/db.js";
import{split} from "sentence-splitter"


//using normal chunking -- old way
// function chunkText(text, chunkSize = 900, overlap = 150) {
//   const clean = text.replace(/\s+/g, " ").trim();
//   const chunks = [];
//   let i = 0;

//   while (i < clean.length) {
//     chunks.push(clean.slice(i, i + chunkSize));
//     i += chunkSize - overlap;
//   }
//   return chunks;
// }


function chunkText(text, chunkSize = 900, overlap = 100) {
  const sentences = split(text)
    .map(s => s.raw)
    .filter(Boolean);

  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize) {
      chunks.push(current.trim());
      current = current.slice(-overlap) + sentence;
    } else {
      current += " " + sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function extractPdfText(buffer) {
  try {
    const data = Uint8Array.from(buffer);

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDoc = await loadingTask.promise;

    console.log(`PDF loaded successfully. Total pages: ${pdfDoc.numPages}`);

    let fullText = "";
    for (let pageNo = 1; pageNo <= pdfDoc.numPages; pageNo++) {
      try {
        const page = await pdfDoc.getPage(pageNo);
        const content = await page.getTextContent();
        const pageText = content.items.map((it) => it.str).join(" ");
        fullText += pageText + "\n";
        console.log(`Extracted text from page ${pageNo}/${pdfDoc.numPages}`);
      } catch (pageError) {
        console.error(`Error extracting text from page ${pageNo}:`, pageError.message);
        // Continue with other pages even if one fails
      }
    }

    return fullText.trim();
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

export async function ingestPdfBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("Invalid or empty PDF buffer");
  }

  const col = db.collection("rag_chunks");
  const docId = uuidv4();

  console.log(`Starting PDF ingestion for docId: ${docId}`);

  try {
    // Extract text from PDF
    const text = await extractPdfText(buffer);
    console.log(`Extracted ${text.length} characters from PDF`);

    if (!text || text.trim().length === 0) {
      throw new Error("No text could be extracted from the PDF");
    }

    // Chunk the text
    const chunks = chunkText(text);
    console.log(`Created ${chunks.length} chunks from PDF`);

    if (chunks.length === 0) {
      throw new Error("No chunks created from PDF text");
    }

    // Generate embeddings for all chunks
    console.log("Generating embeddings...");
    const docs = await Promise.all(
      chunks.map(async (chunk, idx) => {
        try {
          const embedding = await embedText(chunk);
          if (!embedding || embedding.length === 0) {
            throw new Error(`Failed to generate embedding for chunk ${idx}`);
          }
          return {
            docId,
            chunkId: idx,
            text: chunk,
            embedding,
            embeddingModel: "text-embedding-3-large",
            createdAt: new Date(),
          };
        } catch (error) {
          console.error(`Error processing chunk ${idx}:`, error.message);
          throw error;
        }
      })
    );

    console.log(`Generated ${docs.length} embeddings successfully`);

    // Insert into database
    const result = await col.insertMany(docs);
    console.log(`Inserted ${result.insertedCount} chunks into database`);

    return {
      docId,
      chunksStored: docs.length,
      totalCharacters: text.length,
      success: true,
    };
  } catch (error) {
    console.error("Error ingesting PDF:", error);
    throw new Error(`PDF ingestion failed: ${error.message}`);
  }
}