import { db } from "../config/db.js";
import { genratePassword } from "../utils/helper.js";

export async function adduser(req) {
    const user = db.collection("users");
    let payload = {
        name: req.body.name,
        password: await genratePassword(req.body.password),
        createdAt: Date.now(),
    }
    user.insertOne(payload)
    return payload
}


export async function verifyUser(req) {
    const user = db.collection("users");
    const details = await user.findOne({name: req.body.name})
    return details
}


