import OpenAI from "openai";
import { development } from "../config/env.js";

console.log(development.OPENAI_API_KEY)
const client = new OpenAI({ apiKey: development.OPENAI_API_KEY });

export async function embedText(text) {
  const res = await client.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
  });
  return res.data[0].embedding;
}