import dotenv from "dotenv";
dotenv.config();

export const development  ={
    mongoURI : process.env.MONGODB_URI,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    salt: +(process.env.saltRounds)
}
