import { Router } from "express";
import ragRoutes from "./rag.routes.js"
import userRoutes from "./user.routes.js"

const router = Router()

router.use('/rag',ragRoutes)
router.use('/user',userRoutes)


// module.exports = Router
export default router;