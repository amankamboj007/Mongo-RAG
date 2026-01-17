import { Router } from "express";
import ragRoutes from "./rag.routes.js"

const router = Router()

router.use('/rag',ragRoutes)

// module.exports = Router
export default router;