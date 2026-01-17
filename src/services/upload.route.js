import express from "express";
import { db } from "../db.js";
import { extractPdfPages } from "./pdf.service.js";
import { groupIntoBlocks, blockToText, blockToBoxes } from "../utils/paragraph.utils.js";
import { embedText } from "../services/embedding.service.js";

const router = express.Router();

router.post("/upload", async (req, res) => {
  const filePath = req.file.path;

  const fileDoc = {
    originalName: req.file.originalname,
    path: filePath, 
    createdAt: new Date(),
  };

  const filesCol = db.collection("files");
  const chunksCol = db.collection("chunks");

  const { insertedId: fileId } = await filesCol.insertOne(fileDoc);

  const { pageCount, pages } = await extractPdfPages(filePath);

  await filesCol.updateOne({ _id: fileId }, { $set: { pageCount } });

  for (const p of pages) {
    const blocks = groupIntoBlocks(p.items);

    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const block = blocks[blockIndex];
      const text = blockToText(block);

      if (text.length < 40) continue; // skip tiny junk

      const embedding = await embedText(text);

      await chunksCol.insertOne({
        fileId,
        pageNumber: p.pageNumber,
        blockIndex,
        text,
        boxes: blockToBoxes(block),
        embedding,
        createdAt: new Date(),
      });
    }
  }

  res.json({ fileId, pageCount });
});

export default router;