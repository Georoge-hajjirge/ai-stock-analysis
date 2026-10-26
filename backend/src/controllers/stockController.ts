
import { Request, Response } from "express";
import {
    searchStocks,
    getStockData,
    getHistoricalData,
    getFundamentals,
    type StockPeriod,
} from "../services/stockService.js";
import { getStockNews } from "../services/newsService.js";
import {
    generateStockAnalysis,
    generateStockQuestionAnswer,
} from "../services/aiService.js";
import {
    calculateInvestmentScenarios,
    InvestmentScenario,
    ParsedInvestmentRequest,
    parseInvestmentRequest,
} from "../services/investmentPredictionService.js";

export const searchStockController = async (
    req: Request,
    res: Response
) => {
    try {
        const query = String(req.query.q || "").trim();

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required",
            });
        }

        const stocks = await searchStocks(query);

        return res.status(200).json({
            success: true,
            data: stocks,
        });
    } catch (error: unknown) {
        console.error("Stock search controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to search stocks",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getStockController = async (
    req: Request,
    res: Response
) => {
    try {
        const symbol = String(req.params.symbol || "").trim();

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required",
            });
        }

        const stock = await getStockData(symbol);

        return res.status(200).json({
            success: true,
            data: stock,
        });
    } catch (error: unknown) {
        console.error("Get stock controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get stock data",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getHistoricalStockController = async (
    req: Request,
    res: Response
) => {
    try {
        const symbol = String(req.params.symbol || "").trim();

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required",
            });
        }

        const requestedPeriod = String(
            req.query.period || "1M"
        ).toUpperCase();

        const validPeriods: StockPeriod[] = [
            "1D",
            "1W",
            "1M",
            "6M",
            "1Y",
        ];

        const period = validPeriods.includes(
            requestedPeriod as StockPeriod
        )
            ? (requestedPeriod as StockPeriod)
            : "1M";

        const historicalData = await getHistoricalData(symbol, period);

        return res.status(200).json({
            success: true,
            period,
            data: historicalData,
        });
    } catch (error: unknown) {
        console.error("Historical stock controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get historical stock data",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getFundamentalsController = async (
    req: Request,
    res: Response
) => {
    try {
        const symbol = String(req.params.symbol || "").trim();

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required",
            });
        }

        const fundamentals = await getFundamentals(symbol);

        return res.status(200).json({
            success: true,
            data: fundamentals,
        });
    } catch (error: unknown) {
        console.error("Fundamentals controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get fundamentals",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getAIStockAnalysisController = async (
    req: Request,
    res: Response
) => {
    try {
        const symbol = String(req.params.symbol || "").trim();

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required",
            });
        }

        const stock = await getStockData(symbol);
        const historicalData = await getHistoricalData(symbol, "1Y");

        const fundamentals = await getFundamentals(symbol).catch(
            () => null
        );

        const news = await getStockNews(symbol).catch(
            () => []
        );

        const analysis = await generateStockAnalysis({
            stock,
            fundamentals,
            news,
            historicalData,
        });

        return res.status(200).json({
            success: true,
            data: analysis,
        });
    } catch (error: unknown) {
        console.error("AI stock analysis controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate AI stock analysis",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


export const getAIStockQuestionController = async (
    req: Request,
    res: Response
) => {
    try {
        const symbol = String(req.params.symbol || "").trim();
        const question = String(req.body?.question || "").trim();

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required",
            });
        }

        if (!question) {
            return res.status(400).json({
                success: false,
                message: "Question is required",
            });
        }

        const conversationMessages = Array.isArray(req.body?.messages)
            ? req.body.messages.filter(
                (message: { role?: string; content?: string }) =>
                    typeof message.content === "string"
            )
            : [];

        const previousUserQuestions = conversationMessages
            .filter(
                (message: { role?: string }) =>
                    message.role === "user"
            )
            .map(
                (message: { content: string }) => message.content
            );

        const lastAssistantMessage = [...conversationMessages]
            .reverse()
            .find(
                (message: { role?: string }) =>
                    message.role === "assistant"
            );

        const lastAssistantAnswer =
            lastAssistantMessage?.content ?? "";

        const investmentIntentRegex =
            /\b(invest|investment|investing|invested|profit|returns?|earnings from investment)\b/i;

        const isAwaitingInvestmentDetail =
            /how much would you like to invest|how long do you plan to hold the investment/i.test(
                lastAssistantAnswer
            );

        // Parse details from the current question.
        const latestParsed = parseInvestmentRequest(question);

        // Start an investment flow only when the current question
        // indicates investment intent, provides an amount/duration,
        // or answers a previous investment clarification.
        const isInvestmentRequest =
            investmentIntentRegex.test(question) ||
            latestParsed.amount !== undefined ||
            latestParsed.durationDays !== undefined ||
            isAwaitingInvestmentDetail;

        const investmentRequest: ParsedInvestmentRequest = {};

        if (isInvestmentRequest) {
            // Find the latest explicit investment request in the conversation.
            const lastInvestmentIntentIndex =
                previousUserQuestions.findLastIndex((userQuestion: string) =>
                    investmentIntentRegex.test(userQuestion)
                );

            // Restore details from the relevant investment conversation.
            const relevantPreviousQuestions =
                lastInvestmentIntentIndex >= 0
                    ? previousUserQuestions.slice(lastInvestmentIntentIndex)
                    : previousUserQuestions;

            for (const userQuestion of relevantPreviousQuestions) {
                const parsed = parseInvestmentRequest(userQuestion);

                if (parsed.amount !== undefined) {
                    investmentRequest.amount = parsed.amount;
                }

                if (parsed.durationDays !== undefined) {
                    investmentRequest.durationDays = parsed.durationDays;
                    investmentRequest.durationLabel =
                        parsed.durationLabel;
                }
            }

            // The current question takes priority over previous details.
            if (latestParsed.amount !== undefined) {
                investmentRequest.amount = latestParsed.amount;
            }

            if (latestParsed.durationDays !== undefined) {
                investmentRequest.durationDays =
                    latestParsed.durationDays;
                investmentRequest.durationLabel =
                    latestParsed.durationLabel;
            }

            // Ask only for the missing detail.
            if (investmentRequest.amount === undefined) {
                return res.status(200).json({
                    success: true,
                    data: "How much would you like to invest?",
                });
            }

            if (
                investmentRequest.durationDays === undefined ||
                !investmentRequest.durationLabel
            ) {
                return res.status(200).json({
                    success: true,
                    data: "How long do you plan to hold the investment?",
                });
            }
        }

        // Fetch stock data only after the required investment details
        // are available, or when answering a normal stock question.
        const stock = await getStockData(symbol);
        const historicalData = await getHistoricalData(symbol, "1Y");

        const fundamentals = await getFundamentals(symbol).catch(
            () => null
        );

        const news = await getStockNews(symbol).catch(() => []);

        // Calculate scenarios only for a complete investment request.
        let investmentScenario: InvestmentScenario | undefined;

        if (
            isInvestmentRequest &&
            investmentRequest.amount !== undefined &&
            investmentRequest.durationDays !== undefined &&
            investmentRequest.durationLabel
        ) {
            investmentScenario = calculateInvestmentScenarios(
                stock,
                historicalData,
                investmentRequest.amount,
                investmentRequest.durationDays,
                investmentRequest.durationLabel
            );
        }

        console.log("Investment request:", investmentRequest);
        console.log("Is investment request:", isInvestmentRequest);
        console.log("Stock price:", stock.price);
        console.log("Historical records:", historicalData.length);
        console.log("Investment scenario:", investmentScenario);

        const answer = await generateStockQuestionAnswer({
            stock,
            fundamentals,
            historicalData,
            news,
            question,
            investmentRequest: isInvestmentRequest
                ? investmentRequest
                : {},
            investmentScenario,
        });

        return res.status(200).json({
            success: true,
            data: answer,
        });
    } catch (error: unknown) {
        console.error("AI stock question controller error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to answer stock question",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
        });
    }
};

