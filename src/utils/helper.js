import bcrypt from 'bcrypt';
import { development } from '../config/env';

export async function genratePassword (plainText){
    return bcrypt.hash(plainText,development.salt)
}
