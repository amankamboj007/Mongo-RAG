import { db } from "../config/db.js";
import {} from 'bcrpyt'
import { genratePassword } from "../utils/helper.js";

export async function adduser (req, res){
    try {
        const user = db.collection("users");

        let body = {
            name: req.body.name,
            password : genratePassword(req.body.password)
        }


         res.send({
            message: "User created",
            body:body
         }).status(201)
    } catch (error) {
        res.send({ message: error ? error : "Internal Server Error" }).status(400)
    }
}