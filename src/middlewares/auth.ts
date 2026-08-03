import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"


interface JWTPayload {
    userId: number
    nome: string
    role: string
}

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload
        }
}}


export function authenticate (req : Request, res : Response, next : NextFunction) {
    const headerQueVeioDoCliente = req.headers.authorization

    if (!headerQueVeioDoCliente || !headerQueVeioDoCliente.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token de autenticação não fornecido" })
    }

    const token = headerQueVeioDoCliente.split(" ")[1]
    try {
        const tokenDecodificado = jwt.verify(token, JWT_SECRET) as JWTPayload
        req.user = tokenDecodificado
        next()
    } catch (error) {
        return res.status(401).json({ error: "Token de autenticação inválido" })
    }
}

const JWT_SECRET = process.env.JWT_SECRET ?? "sesisenai"

export function requireAdmin (req : Request, res : Response, next : NextFunction) {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado: apenas administradores podem acessar este recurso" })
    }
    next()
}
