import type { Request, Response } from "express";

import {
    getMarketBulkDeals,
    getMarketBlockDeals,
    getMarketInsiderTrades,
    getFiiDiiActivity,
    getMutualFundPortfolioHoldings,
    searchMutualFundPortfolios,
} from "../services/investorIntelligenceService.js";

function getPageParams(req: Request) {
    const page = Math.max(1, Math.floor(Number(req.query.page) || 1));

    const pageSize = Math.min(
        100,
        Math.max(1, Math.floor(Number(req.query.pageSize) || 20))
    );

    return { page, pageSize };
}

function getBuySell(req: Request): "BUY" | "SELL" | undefined {
    const value = String(req.query.buySell ?? "").toUpperCase();
    return value === "BUY" || value === "SELL" ? value : undefined;
}

async function respond(
    res: Response,
    operation: () => Promise<unknown>
) {
    try {
        const result = await operation();

        if (
            result &&
            typeof result === "object" &&
            "status" in result &&
            result.status === "unavailable"
        ) {
            const message =
                "message" in result && typeof result.message === "string"
                    ? result.message
                    : "Investor data is currently unavailable.";

            return res.status(502).json({
                success: false,
                message,
            });
        }

        if (
            result &&
            typeof result === "object" &&
            "status" in result &&
            result.status === "available" &&
            "data" in result
        ) {
            return res.status(200).json({
                success: true,
                data: result.data,
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        console.error("Investor Intelligence error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve investor information.",
        });
    }
}

export const marketBulkDealsController = (
    req: Request,
    res: Response
) => {
    const { page, pageSize } = getPageParams(req);

    return respond(res, () =>
        getMarketBulkDeals(page, pageSize, getBuySell(req))
    );
};

export const marketBlockDealsController = (
    req: Request,
    res: Response
) => {
    const { page, pageSize } = getPageParams(req);

    return respond(res, () =>
        getMarketBlockDeals(page, pageSize, getBuySell(req))
    );
};

export const marketInsiderTradesController = (
    req: Request,
    res: Response
) => {
    const { page, pageSize } = getPageParams(req);

    const rawType = String(
        req.query.transactionType ?? ""
    ).toLowerCase();

    const transactionType =
        rawType === "acquisition" || rawType === "disposal"
            ? rawType
            : undefined;

    const promotersOnly =
        String(req.query.promotersOnly ?? "").toLowerCase() === "true";

    return respond(res, () =>
        getMarketInsiderTrades(
            page,
            pageSize,
            transactionType,
            promotersOnly
        )
    );
};

export const fiiDiiActivityController = (
    req: Request,
    res: Response
) => {
    const from =
        typeof req.query.from === "string" ? req.query.from : undefined;

    const to =
        typeof req.query.to === "string" ? req.query.to : undefined;

    return respond(res, () => getFiiDiiActivity(from, to));
};



export async function getMutualFundPortfolios(
    req: Request,
    res: Response
) {
    const query = String(req.query.q ?? "").trim();
    const fundHouse = String(req.query.fundHouse ?? "").trim();

    const limit = Math.min(
        200,
        Math.max(1, Math.floor(Number(req.query.limit) || 50))
    );

    const offset = Math.max(
        0,
        Math.floor(Number(req.query.offset) || 0)
    );

    return respond(res, () =>
        searchMutualFundPortfolios(
            query,
            fundHouse,
            limit,
            offset
        )
    );
}

export async function getMutualFundHoldings(
    req: Request,
    res: Response
) {
    const schemeName = String(req.params.schemeName ?? "").trim();

    const page = Math.max(
        1,
        Math.floor(Number(req.query.page) || 1)
    );

    const pageSize = Math.min(
        100,
        Math.max(1, Math.floor(Number(req.query.pageSize) || 50))
    );

    const month = String(req.query.month ?? "").trim();

    return respond(res, () =>
        getMutualFundPortfolioHoldings(
            schemeName,
            page,
            pageSize,
            month || undefined
        )
    );
}
