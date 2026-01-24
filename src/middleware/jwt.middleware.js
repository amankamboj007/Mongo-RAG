import jwt from 'jsonwebtoken'
import { development } from '../config/env.js';
import { db } from '../config/db.js';
import { ObjectId } from "mongodb";



export async function verifyToken(req, res, next) {
    try {
        const { authorization } = req.headers
        if (!authorization) {
            return next(new Error("Token not found"))
        }
        const token = authorization.split('Bearer')[1]?.trim()

        const verified = jwt.verify(token, development.secret)
        const userCollection = db.collection("users")
        if (!verified && verified._id) {
            return next(new Error("Id not found"))
        }
        const payload = await userCollection.findOne({ _id: new ObjectId(verified._id) }, { projection: { password: 0 } })
        if (!payload) {
            return next(new Error("User not found"))
        }
        req.user = payload

        next()
    } catch (error) {
        next(error)

    }
}