import { db } from "../config/db.js";
import { compareHash, genratePassword, genrateToken } from "../utils/helper.js";
import { ObjectId } from "mongodb";

export async function adduser(req) {
    const user = db.collection("users")
    let payload = {
        email: req.body.email,
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

export async function loginUser(req) {
    try {
        const user = db.collection("users")
        let detail = await user.findOne({ email: req.body.email })
        if (!detail) {
            throw new Error("User not found")
        }

        let validUser = await compareHash(req.body.password, detail.password)
        if (!validUser) {
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

export async function profileService(req) {
    try {
        if (!req.user._id) {
            throw new Error("User not found")
        }
        const user = db.collection("users")
        let curr = user.aggregate([
            {
                $match: { _id: new ObjectId(req.user._id) }
            },

            {
                $lookup: {
                    from: "user_docs",
                    localField: "_id",
                    foreignField: "userId",
                    as: "my_docs"
                }
            },
            {
                $unwind:"$my_docs"
            },
            {
                $group: {
                    _id: "$_id",
                    name: {"$first": "$name"},
                    email: {"$first": "$email"},
                    docId: {"$push": {
                        docId: "$my_docs.docId",
                        fileName: "$my_docs.fileName"

                    }},

                }
            },
            {
                $project: {
                    _id:0,
                    email:1,
                    name:1,
                    docId:1
                }
            }
        ])
        let detail = await curr.toArray()

        if (!detail) {
            throw new Error("User not found")
        }
        return detail
    } catch (error) {
        throw error
    }
}




