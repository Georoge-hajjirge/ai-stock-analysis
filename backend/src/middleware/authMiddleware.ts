import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    userId?: string;
}

export function requireAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): void {
    const token = req.cookies?.token as string | undefined;
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        res.status(500).json({ message: "Authentication is not configured" });
        return;
    }

    if (!token) {
        res.status(401).json({ message: "Please log in to continue" });
        return;
    }

    try {
        const payload = jwt.verify(token, secret);

        if (typeof payload === "string" || !payload.sub) {
            res.status(401).json({ message: "Invalid authentication token" });
            return;
        }

        req.userId = payload.sub;
        next();
    } catch {
        res.status(401).json({ message: "Session expired. Please log in again." });
    }
}