import type { Response } from "express";
import User from "../models/User.js";
import type { AuthRequest } from "../middleware/authMiddleware.js";

export async function getFavourites(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const user = await User.findById(req.userId).select("favourites");

        if (!user) {
            res.status(401).json({ message: "User account not found" });
            return;
        }

        res.json({ favourites: user.favourites });
    } catch (error) {
        console.error("Get favourites failed:", error);
        res.status(500).json({ message: "Unable to load favourites" });
    }
}

export async function addFavourite(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const symbol = String(req.body.symbol ?? "").trim().toUpperCase();
        const name = String(req.body.name ?? "").trim();
        const exchange = String(req.body.exchange ?? "").trim();

        if (!symbol || !name) {
            res.status(400).json({ message: "Stock symbol and name are required" });
            return;
        }

        const user = await User.findById(req.userId);

        if (!user) {
            res.status(401).json({ message: "User account not found" });
            return;
        }

        const existing = user.favourites.some(
            (item) => item.symbol === symbol,
        );

        if (existing) {
            res.json({ favourites: user.favourites });
            return;
        }

        user.favourites.push({
            symbol,
            name,
            exchange,
            addedAt: new Date(),
        });

        await user.save();

        res.status(201).json({ favourites: user.favourites });
    } catch (error) {
        console.error("Add favourite failed:", error);
        res.status(500).json({ message: "Unable to add favourite" });
    }
}

export async function removeFavourite(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const symbol = String(req.params.symbol ?? "").trim().toUpperCase();
        const user = await User.findById(req.userId);

        if (!user) {
            res.status(401).json({ message: "User account not found" });
            return;
        }

        user.favourites = user.favourites.filter(
            (item) => item.symbol !== symbol,
        );

        await user.save();

        res.json({ favourites: user.favourites });
    } catch (error) {
        console.error("Remove favourite failed:", error);
        res.status(500).json({ message: "Unable to remove favourite" });
    }
}