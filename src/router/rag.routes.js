import { Router } from "express";
import { chatFunction, uploadFunction } from "../controller/rag.controller.js"
import multer from "multer";
const upload = multer();
const router = Router();


router.post("/ingest/pdf", upload.single("file"), uploadFunction)

router.post("/chat", chatFunction);


// module.exports = Router
export default router;