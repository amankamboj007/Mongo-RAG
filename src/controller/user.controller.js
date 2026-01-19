import { adduser, verifyUser } from "../services/user.service.js";


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
        const user = await verifyUser(req)

        res.send({
            message: "User fetched",
            body: user
        }).status(200)

    } catch (error) {
        res.send({ message: error ? error : "Internal Server Error" }).status(400)

    }
}