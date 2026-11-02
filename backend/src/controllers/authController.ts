import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

const COOKIE_NAME = "token";

function setAuthCookie(res: Response, userId: string): void {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign({}, secret, {
        subject: userId,
        expiresIn: "7d",
    });

    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    });
}

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const firstName = String(req.body.firstName ?? "").trim();
        const lastName = String(req.body.lastName ?? "").trim();
        const phoneNumber = String(req.body.phoneNumber ?? "").trim();
        const email = String(req.body.email ?? "").trim().toLowerCase();
        const password = String(req.body.password ?? "");

        if (!firstName || !lastName || !phoneNumber || !email || !password) {
            res.status(400).json({
                message: "First name, last name, phone number, email and password are required",
            });
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400).json({ message: "Enter a valid email address" });
            return;
        }

        if (!/^[+]?[\d\s()-]{7,20}$/.test(phoneNumber)) {
            res.status(400).json({ message: "Enter a valid phone number" });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({
                message: "Password must be at least 8 characters",
            });
            return;
        }

        const existingUser = await User.findOne({ email }).lean();

        if (existingUser) {
            res.status(409).json({ message: "An account with this email already exists" });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            firstName,
            lastName,
            phoneNumber,
            email,
            passwordHash,
        });

        setAuthCookie(res, user.id);

        res.status(201).json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                email: user.email,
            },
        });
    } catch (error) {
        if ((error as { code?: number }).code === 11000) {
            res.status(409).json({ message: "An account with this email already exists" });
            return;
        }

        console.error("Registration failed:", error);
        res.status(500).json({ message: "Unable to register right now" });
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const email = String(req.body.email ?? "").trim().toLowerCase();
        const password = String(req.body.password ?? "");

        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }

        const user = await User.findOne({ email }).select("+passwordHash");

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        setAuthCookie(res, user.id);

        res.json({
            user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
        });
    } catch (error) {
        console.error("Login failed:", error);
        res.status(500).json({ message: "Unable to log in right now" });
    }
}

export function logout(_req: Request, res: Response): void {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    res.json({ message: "Logged out successfully" });
}

export async function getCurrentUser(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const user = await User.findById(req.userId).select(
            "firstName lastName phoneNumber email",
        );

        if (!user) {
            res.status(401).json({ message: "User account not found" });
            return;
        }

        res.json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                email: user.email,
            },
        });
    } catch {
        res.status(500).json({ message: "Unable to retrieve your account" });
    }
}