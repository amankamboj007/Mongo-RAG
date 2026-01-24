import { Router } from "express";
const router = Router();
import { addUsers, login, profile } from "../controller/user.controller.js";

import { verifyToken } from "../middleware/jwt.middleware.js"


router.post("/add", addUsers);
router.post("/login", login);
router.get("/my-profile", verifyToken, profile);




// module.exports = Router
export default router;