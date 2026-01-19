import { Router } from "express";
const router = Router();
import { addUsers, login } from "../controller/user.controller.js";


router.post("/add", addUsers);
router.post("/login", login);



// module.exports = Router
export default router;