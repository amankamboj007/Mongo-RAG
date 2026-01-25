import bcrypt from 'bcrypt';
import { development } from '../config/env.js';
import jwt from 'jsonwebtoken'
import OpenAI from "openai";
import { db } from '../config/db.js';


const client = new OpenAI({ apiKey: development.OPENAI_API_KEY });

export async function genratePassword(plainText) {
    let hash = await bcrypt.hash(plainText, development.salt)
    return hash
}
export async function compareHash(plainText, hash) {
    let compareResult = await bcrypt.compare(plainText, hash)
    return compareResult
}

export async function genrateToken(payload) {
    let body = { ...payload, exp: Math.floor(Date.now() / 1000) + (60 * 60) }
    let token = jwt.sign(body, development.secret)
    return token
}

export async function generateDocumentProfile(chunks) {
    const sampleText = chunks
        .slice(0, 8)
        .map((c, i) => `Chunk ${i + 1}: ${c}`)
        .join("\n\n");

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
            {
                role: "system",
                content: `
You analyze documents and create a short profile.

Rules:
- Summary: max 2 sentences
- docType: one word (resume, policy, report, manual, contract, other)
- keyTopics: 3–6 short phrases
- Return STRICT JSON only

JSON format:
{
  "docType": "",
  "summary": "",
  "keyTopics": []
}
        `
            },
            {
                role: "user",
                content: sampleText
            }
        ]
    });

    return JSON.parse(response.choices[0].message.content);
}


export async function decomposeQuestionWithDocIds({ docIds, question }) {
    if (!Array.isArray(docIds) || docIds.length === 0 || !question) {
        return [
            {
                subQuestion: question,
                docIds: []
            }
        ];
    }

    const docCollection = db.collection("user_docs");
    const documents = await docCollection
        .find({ docId: { $in: docIds } })
        .project({
            _id: 0,
            docId: 1,
            fileName: 1,
            docType: 1,
            summary: 1,
            keyTopics: 1
        })
        .toArray();

    if (!documents.length) {
        return [
            {
                subQuestion: question,
                docIds: []
            }
        ];
    }

    const documentContext = documents
        .map((d, i) => `
Document ${i + 1}:
docId: ${d.docId}
fileName: ${d.fileName}
docType: ${d.docType}
summary: ${d.summary}
keyTopics: ${d.keyTopics.join(", ")}
`)
        .join("\n");


    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
            {
                role: "system",
                content: `
You are a question decomposition and document routing engine for a RAG system.

Rules:
- Use ONLY the provided documents
- Split the question ONLY if it contains multiple independent requests
- Each sub-question must be self-contained
- Assign docIds strictly from the provided list
- Use semantic meaning, not keyword matching
- If a sub-question does not match any document, return docIds: []
- Do NOT invent docIds
- Return STRICT JSON only

Output format:
[
  {
    "subQuestion": "<clear standalone question>",
    "docIds": ["<docId>", "..."]
  }
]
        `
            },
            {
                role: "user",
                content: `
Available Documents:
${documentContext}

User Question:
${question}
        `
            }
        ]
    });


    return JSON.parse(response.choices[0].message.content);
}

