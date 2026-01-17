import { MongoClient } from "mongodb";
import { development } from "./env.js"
const client = new MongoClient(development.mongoURI);

export const db = client.db("rag_pdf");

export async function connectDB() {
  try {
      await client.connect();
        console.log("✅ Mongo connected");
  } catch (error) {
    console.log("ERROR")
    console.log(error)
  }


}