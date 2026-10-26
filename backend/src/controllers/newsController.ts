import { Request, Response } from "express";
import { getStockNews } from "../services/newsService.js";

export const getNewsController = async (
    req: Request,
    res: Response
) => {
    try {
        const symbol = String(req.params.symbol || "");

        if (!symbol.trim()) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required",
            });
        }

        const news = await getStockNews(symbol);

        return res.status(200).json({
            success: true,
            data: news,
        });
    } catch (error: unknown) {
        console.error("News controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get stock news",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
        });
    }
};