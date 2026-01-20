import { db } from "../config/db.js";
import { compareHash, genratePassword, genrateToken } from "../utils/helper.js";

export async function adduser(req) {
    const user = db.collection("users")
    let payload = {
        email:req.body.email,
        name: req.body.name,
        password: await genratePassword(req.body.password),
        createdAt: Date.now(),
    }
    try {
    await user.insertOne(payload)
    return

    } catch (error) {
        console.log(error)
        throw error
    }
}

export async function loginUser(req){
    try {
        const user = db.collection("users")
        let detail = await user.findOne({email: req.body.email})
        if(!detail){
            throw new Error("User not found")
        }

        let validUser = await compareHash(req.body.password, detail.password)
        if(!validUser){
            throw new Error("Id or Pass wrong")
        }
        delete detail.password
        let token = await genrateToken(detail)
        console.log(token)
        return token
    } catch (error) {
        throw error
    }
}


