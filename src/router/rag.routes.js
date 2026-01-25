import { Router } from "express";
import { chatFunction, chatFunctionMultiDocs, uploadFunction } from "../controller/rag.controller.js"
import multer from "multer";
const upload = multer();
const router = Router();
import { verifyToken } from "../middleware/jwt.middleware.js"



router.post("/ingest/pdf", upload.single("file"), verifyToken,uploadFunction)

router.post("/chat", verifyToken,chatFunction);

router.post("/chat/multi-docs", verifyToken,chatFunctionMultiDocs);



// module.exports = Router
export default router;