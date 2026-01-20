import { adduser, loginUser } from "../services/user.service.js";


export async function addUsers(req, res) {
    try {
        const user = await adduser(req)

        res.send({
            message: "User created",
            body: user
        }).status(201)

    } catch (error) {
        res.send({ message: error ? error : "Internal Server Error" }).status(400)

    }
}

export async function login(req, res) {
    try {
        const user = await loginUser(req)

        res.send({
            message: "User validated",
            data: user
        }).status(200)

    } catch (error) {
        res.send({ message: error ? error : "Internal Server Error" }).status(400)

    }
}