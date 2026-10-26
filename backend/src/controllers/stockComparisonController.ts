import type { Request, Response } from "express";
import {
    getFundamentals,
    getHistoricalData,
    getStockData,
} from "../services/stockService.js";
import { generateStockComparison } from "../services/aiService.js";
import { getStockNews } from "../services/newsService.js";

export const compareStocksController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { symbols } = req.body as { symbols?: unknown };

        // Validate stock symbols
        if (
            !Array.isArray(symbols) ||
            symbols.length < 2 ||
            symbols.length > 3 ||
            !symbols.every(
                (symbol): symbol is string =>
                    typeof symbol === "string" &&
                    symbol.trim().length > 0
            )
        ) {
            res.status(400).json({
                success: false,
                message: "Provide between 2 and 3 valid stock symbols.",
            });
            return;
        }

        const uniqueSymbols = [
            ...new Set(
                symbols.map((symbol) => symbol.trim().toUpperCase())
            ),
        ];

        if (uniqueSymbols.length !== symbols.length) {
            res.status(400).json({
                success: false,
                message: "Please select different stocks to compare.",
            });
            return;
        }

        // Fetch stock data
        const results = await Promise.allSettled(
            uniqueSymbols.map(async (symbol) => {
                const stock = await getStockData(symbol);

                const [
                    historyResult,
                    fundamentalsResult,
                    newsResult,
                ] = await Promise.allSettled([
                    getHistoricalData(symbol, "1Y"),
                    getFundamentals(symbol),
                    getStockNews(symbol),
                ]);

                return {
                    symbol,
                    stock,
                    history:
                        historyResult.status === "fulfilled"
                            ? historyResult.value
                            : [],
                    fundamentals:
                        fundamentalsResult.status === "fulfilled"
                            ? fundamentalsResult.value
                            : null,
                    news:
                        newsResult.status === "fulfilled"
                            ? newsResult.value
                            : [],
                };
            })
        );

        // Keep successfully retrieved stocks
        const stocks = results.flatMap((result) =>
            result.status === "fulfilled" ? [result.value] : []
        );

        // Identify stocks whose current data could not be retrieved
        const unavailableSymbols = results.flatMap((result, index) =>
            result.status === "rejected"
                ? [uniqueSymbols[index]]
                : []
        );

        if (stocks.length < 2) {
            res.status(502).json({
                success: false,
                message:
                    "Unable to retrieve enough stock data. Please check the symbols and try again.",
                unavailableSymbols,
            });
            return;
        }

        // Generate AI analysis using the complete historical data
        const aiAnalysis = await generateStockComparison(stocks);

        // Return summarized history instead of thousands of historical records
        const comparisonData = stocks.map((item) => {
            const validHistory = item.history
                .filter(
                    (record) =>
                        typeof record.close === "number" &&
                        Number.isFinite(record.close) &&
                        record.close > 0
                )
                .sort((a, b) => a.timestamp - b.timestamp);

            const first = validHistory[0];
            const latest = validHistory[validHistory.length - 1];

            const historicalChangePercent =
                typeof first?.close === "number" &&
                    typeof latest?.close === "number" &&
                    first.close > 0
                    ? Number(
                        (
                            ((latest.close - first.close) /
                                first.close) *
                            100
                        ).toFixed(2)
                    )
                    : null;

            return {
                symbol: item.symbol,
                stock: item.stock,
                fundamentals: item.fundamentals,
                historicalPerformance: {
                    earliestDate: first?.date ?? null,
                    earliestClose: first?.close ?? null,
                    latestDate: latest?.date ?? null,
                    latestClose: latest?.close ?? null,
                    changePercent: historicalChangePercent,
                    observations: validHistory.length,
                },
                news: item.news.slice(0, 2),
            };
        });

        res.status(200).json({
            success: true,
            data: comparisonData,
            aiAnalysis,
            unavailableSymbols,
        });
    } catch (error: unknown) {
        console.error("Stock comparison error:", error);

        res.status(500).json({
            success: false,
            message:
                "Unable to compare stocks right now. Please try again.",
        });
    }
};
