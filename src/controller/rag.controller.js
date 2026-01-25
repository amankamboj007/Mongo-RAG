import { answerQuestion, answerQuestionMultiDocs } from "../services/chat.js";
import { ingestPdfBuffer } from "../services/upload-clean.route.js";
import { decomposeQuestionWithDocIds } from "../utils/helper.js";


export async function uploadFunction(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file provided",
        message: "Please upload a PDF file using the 'file' field",
      });
    }

    if (!req.file.buffer) {
      return res.status(400).json({
        error: "Invalid file",
        message: "File buffer is missing",
      });
    }

    console.log(`Received PDF upload: ${req.file.originalname}, size: ${req.file.size} bytes`);
    const metaData = {
      fileName: req.file.originalname,
      userId: req.user._id
    }
    const out = await ingestPdfBuffer(req.file.buffer, metaData);

    res.json({
      ...out,
      message: "PDF ingested successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      message: error.message,
    });
  }
}

export async function chatFunction(req, res) {
  try {
    const { docId, question } = req.body;

    if (!docId || !question) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Both 'docId' and 'question' are required",
      });
    }

    console.log(`Chat request - docId: ${docId}, question: ${question.substring(0, 50)}...`);

    const out = await answerQuestion({ docId, question });
    res.json(out);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Chat request failed",
      message: error.message,
    });
  }
}

export async function chatFunctionMultiDocs(req, res) {
  try {
    const { docIds, question } = req.body;

    if (!docIds || !question) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Both 'docId' and 'question' are required",
      });
    }
    const parts = await decomposeQuestionWithDocIds({ docIds, question });

    const answers = [];
    for (const part of parts) {
      const result = await answerQuestionMultiDocs({
        docIds: part.docIds,
        question: part.subQuestion
      });

      answers.push({
        question: part.subQuestion,
        answer: result.answer
      });
    }
    res.json(answers);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Chat request failed",
      message: error.message,
    });
  }
}



