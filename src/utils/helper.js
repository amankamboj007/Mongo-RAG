import bcrypt from 'bcrypt';
import { development } from '../config/env.js';


export async function genratePassword (plainText){
    let hash =  await bcrypt.hash(plainText,development.salt)
    return hash
}
