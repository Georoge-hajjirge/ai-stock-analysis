import { Request, Response } from "express";
import { getPositiveStocks } from "../services/positiveStocksService.js";

export const getPositiveStocksController = async (
    _req: Request,
    res: Response
) => {
    try {
        const data = await getPositiveStocks();

        return res.status(200).json({ success: true, data });
    } catch (error: unknown) {
        console.error("Positive stocks controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get positive stocks",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};