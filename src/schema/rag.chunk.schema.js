import mongoose from "mongoose";

const RagChunkSchema = new mongoose.Schema(
  {
    docId: {
      type: String,
      required: true,
      index: true,
    },

    userId: {
      type: String,
      index: true,
    },

    chunkId: {
      type: Number,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    tokenCount: {
      type: Number,
    },

    embedding: {
      type: [Number],
      required: true,
    },

    embeddingModel: {
      type: String,
      default: "text-embedding-3-large",
    },

    sourceType: {
      type: String,
      enum: ["pdf", "docx", "txt"],
      default: "pdf",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "rag_chunks",
    versionKey: false,
  }
);

RagChunkSchema.index({ docId: 1, chunkId: 1 }, { unique: true });

export const RagChunk = mongoose.model("RagChunk", RagChunkSchema);