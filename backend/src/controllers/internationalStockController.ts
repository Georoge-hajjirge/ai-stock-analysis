
import type { Request, Response } from "express";
import type { StockPeriod } from "../types/stock.js";
import {
    getInternationalStockData,
    getInternationalHistoricalData,
    getInternationalFundamentals,
    searchInternationalStocks,
    getInternationalMarketOverview,
} from "../services/internationalStockService.js";

const validPeriods: StockPeriod[] = [
    "1D",
    "1W",
    "1M",
    "6M",
    "1Y",
    "5Y",
    "ALL",
];

export const getInternationalStock = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { symbol } = req.params;

        if (typeof symbol !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid stock symbol",
            });
            return;
        }

        const stock = await getInternationalStockData(symbol);

        res.status(200).json({
            success: true,
            data: stock,
        });
    } catch (error: unknown) {
        console.error("[International Stock Controller]", error);

        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch international stock",
        });
    }
};

export const getInternationalHistory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { symbol } = req.params;
        const requestedPeriod = req.query.period;

        if (typeof symbol !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid stock symbol",
            });
            return;
        }

        const period =
            typeof requestedPeriod === "string"
                ? requestedPeriod
                : "1M";

        if (!validPeriods.includes(period as StockPeriod)) {
            res.status(400).json({
                success: false,
                message: "Invalid period. Supported periods: 1D, 1W, 1M, 6M, 1Y, 5Y, ALL",
            });
            return;
        }

        const history = await getInternationalHistoricalData(
            symbol,
            period as StockPeriod
        );

        res.status(200).json({
            success: true,
            data: history,
        });
    } catch (error: unknown) {
        console.error("[International History Controller]", error);

        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch international history",
        });
    }
};

export const getInternationalFundamentalsController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { symbol } = req.params;

        if (typeof symbol !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid stock symbol",
            });
            return;
        }

        const fundamentals =
            await getInternationalFundamentals(symbol);

        res.status(200).json({
            success: true,
            data: fundamentals,
        });
    } catch (error: unknown) {
        console.error(
            "[International Fundamentals Controller]",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch international fundamentals",
        });
    }
};
export const searchInternationalStocksController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { query, country } = req.query;

        if (typeof query !== "string" || typeof country !== "string") {
            res.status(400).json({
                success: false,
                message: "Query and country are required",
            });
            return;
        }

        const stocks = await searchInternationalStocks(query, country);

        res.status(200).json({
            success: true,
            data: stocks,
        });
    } catch (error: unknown) {
        console.error("[International Search Controller]", error);

        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to search international stocks",
        });
    }
};
export const getInternationalMarketOverviewController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { country } = req.params;

        if (typeof country !== "string" || !country.trim()) {
            res.status(400).json({
                success: false,
                message: "Invalid country",
            });
            return;
        }

        const market = await getInternationalMarketOverview(country);

        res.status(200).json({
            success: true,
            data: market,
        });
    } catch (error: unknown) {
        console.error("[International Market Overview Controller]", error);

        const isUnsupportedMarket =
            error instanceof Error &&
            error.message === "Unsupported international market";

        res.status(isUnsupportedMarket ? 400 : 500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch international market overview",
        });
    }
};