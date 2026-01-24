import "./config/env.js";

import express from "express";
import { connectDB, db } from "./config/db.js";
import intializeRoutes from "./router/index.routes.js";


const app = express();
app.use(express.json());

await connectDB();

app.use((req, res, next) => {
  console.log(req.url)
  next()
})

app.use("/v1", intializeRoutes)

app.use((err,req,res,next)=>{
  console.log("Global error ",err)
  res.status(err.statusCode || 401 ).json({
    success:false,
    message:err.message || "Internal server error"
  })
})



app.listen(3000, () => console.log("RAG server running on :3000"));
