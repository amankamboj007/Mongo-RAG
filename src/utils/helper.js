import bcrypt from 'bcrypt';
import { development } from '../config/env.js';
import jwt from 'jsonwebtoken'

export async function genratePassword (plainText){
    let hash =  await bcrypt.hash(plainText,development.salt)
    return hash
}
export async function compareHash(plainText,hash){
    let compareResult = await bcrypt.compare(plainText,hash)
    return compareResult
}

export async function genrateToken(payload){
    let body = {...payload, exp: Math.floor(Date.now() / 1000) + (60 * 60)}
    let token = jwt.sign(body,development.secret)
    return token
}

