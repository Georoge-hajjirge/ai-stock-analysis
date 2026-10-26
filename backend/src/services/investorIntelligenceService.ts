import axios from "axios";

const BASE_URL = (
    process.env.BHARATSTOCK_BASE_URL || "https://bharatstockapi.com"
).replace(/\/$/, "");

const API_KEY = process.env.BHARATSTOCK_API_KEY;

type Params = Record<string, string | number | boolean>;
type Row = Record<string, unknown>;

type ApiResult =
    | { status: "available"; data: unknown }
    | { status: "unavailable"; message: string };

type CachedBharatStockResponse = {
    data: unknown;
    expiresAt: number;
};

const bharatStockCache = new Map<
    string,
    CachedBharatStockResponse
>();

const pendingBharatStockRequests = new Map<
    string,
    Promise<ApiResult>
>();

const getCacheTtl = (endpoint: string): number => {
    const hours = 60 * 60 * 1000;

    if (endpoint.startsWith("/v1/mf/portfolios/")) {
        return 24 * hours;
    }

    if (endpoint === "/v1/mf/portfolios") {
        return 12 * hours;
    }

    if (endpoint === "/v1/market/fii-dii") {
        return 12 * hours;
    }

    if (
        endpoint === "/v1/deals/bulk" ||
        endpoint === "/v1/deals/block" ||
        endpoint === "/v1/insider-trades"
    ) {
        return 30 * 60 * 1000;
    }

    return 5 * 60 * 1000;
};


async function fetchBharatStock(
    endpoint: string,
    params?: Params
): Promise<ApiResult> {
    if (!API_KEY) {
        return {
            status: "unavailable",
            message: "BharatStock API key is not configured.",
        };
    }

    // Include filters and pagination in the cache key.
    const normalizedParams = Object.entries(params ?? {})
        .sort(([a], [b]) => a.localeCompare(b));

    const cacheKey = `${endpoint}:${JSON.stringify(normalizedParams)}`;
    const now = Date.now();
    const cached = bharatStockCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
        console.log(`[Cache HIT] BharatStock: ${endpoint}`);

        return {
            status: "available",
            data: cached.data,
        };
    }

    if (cached) {
        bharatStockCache.delete(cacheKey);
    }

    // Reuse an identical request already in progress.
    const pending = pendingBharatStockRequests.get(cacheKey);

    if (pending) {
        console.log(`[REQUEST REUSED] BharatStock: ${endpoint}`);
        return pending;
    }

    const request = (async (): Promise<ApiResult> => {
        try {
            const response = await axios.get(
                `${BASE_URL}${endpoint}`,
                {
                    headers: { "X-API-Key": API_KEY },
                    params,
                    timeout: 15000,
                }
            );

            bharatStockCache.set(cacheKey, {
                data: response.data,
                expiresAt: Date.now() + getCacheTtl(endpoint),
            });

            console.log(`[Cache SAVED] BharatStock: ${endpoint}`);

            return {
                status: "available",
                data: response.data,
            };
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;

                const detail = (
                    error.response?.data as
                    | { detail?: unknown }
                    | undefined
                )?.detail;

                console.error(
                    `[BharatStock] ${endpoint} -> ${status}`,
                    error.response?.data
                );

                return {
                    status: "unavailable",
                    message:
                        status === 401
                            ? "Invalid BharatStock API key."
                            : status === 429
                                ? typeof detail === "string"
                                    ? detail
                                    : "BharatStock request limit reached."
                                : status === 404
                                    ? "No data available for this request."
                                    : "Unable to retrieve investor data.",
                };
            }

            console.error(
                `[BharatStock] Unexpected error for ${endpoint}:`,
                error
            );

            return {
                status: "unavailable",
                message: "Unexpected error while retrieving investor data.",
            };
        }
    })();

    pendingBharatStockRequests.set(cacheKey, request);

    try {
        return await request;
    } finally {
        pendingBharatStockRequests.delete(cacheKey);
    }
}


function getRows<T>(payload: unknown): T[] {
    if (!payload || typeof payload !== "object") {
        return [];
    }

    const response = payload as { data?: unknown };

    return Array.isArray(response.data)
        ? (response.data as T[])
        : [];
}

function getPagination(payload: unknown) {
    const response = payload as {
        pagination?: {
            page?: number;
            page_size?: number;
            total_items?: number;
            total_pages?: number;
        };
    } | null;

    const pagination = response?.pagination;

    return {
        page: pagination?.page ?? 1,
        pageSize: pagination?.page_size ?? 20,
        totalItems: pagination?.total_items ?? 0,
        totalPages: pagination?.total_pages ?? 0,
    };
}

function mapTransaction(item: Row) {
    return {
        symbol: item.symbol ?? null,
        companyName: item.company_name ?? null,
        date:
            item.deal_date ??
            item.intimation_date ??
            item.acquisition_from_date ??
            null,
        name:
            item.client_name ??
            item.acquirer_name ??
            "Undisclosed",
        category: item.person_category ?? null,
        transactionType:
            item.buy_sell ??
            item.transaction_type ??
            "unknown",
        quantity: item.quantity ?? null,
        price: item.avg_price ?? null,
        value: item.value ?? null,
        sharesBeforePct: item.shares_before_pct ?? null,
        sharesAfterPct: item.shares_after_pct ?? null,
        mode: item.mode ?? null,
        isPromoter: item.is_promoter ?? null,
        remarks: item.remarks ?? null,
    };
}

async function getTransactionData(
    endpoint: string,
    page: number,
    pageSize: number,
    extraParams: Params = {}
) {
    const result = await fetchBharatStock(endpoint, {
        page,
        page_size: pageSize,
        ...extraParams,
    });

    if (result.status === "unavailable") {
        return result;
    }

    return {
        status: "available" as const,
        data: {
            transactions: getRows<Row>(result.data).map(mapTransaction),
            pagination: getPagination(result.data),
        },
    };
}

// Market-wide bulk deals across companies
export const getMarketBulkDeals = (
    page = 1,
    pageSize = 20,
    buySell?: "BUY" | "SELL"
) =>
    getTransactionData(
        "/v1/deals/bulk",
        page,
        pageSize,
        buySell ? { buy_sell: buySell } : {}
    );

// Market-wide block deals across companies
export const getMarketBlockDeals = (
    page = 1,
    pageSize = 20,
    buySell?: "BUY" | "SELL"
) =>
    getTransactionData(
        "/v1/deals/block",
        page,
        pageSize,
        buySell ? { buy_sell: buySell } : {}
    );

// Market-wide insider trades across companies
export const getMarketInsiderTrades = (
    page = 1,
    pageSize = 20,
    transactionType?: "acquisition" | "disposal",
    promotersOnly = false
) =>
    getTransactionData(
        "/v1/insider-trades",
        page,
        pageSize,
        {
            ...(transactionType
                ? { transaction_type: transactionType }
                : {}),
            ...(promotersOnly
                ? { promoters_only: true }
                : {}),
        }
    );

// FII/DII market activity
export async function getFiiDiiActivity(
    from?: string,
    to?: string
) {
    const params: Params = {};

    if (from) {
        params.from = from;
    }

    if (to) {
        params.to = to;
    }

    if (!from && !to) {
        params.latest = true;
    }

    const result = await fetchBharatStock(
        "/v1/market/fii-dii",
        params
    );

    if (result.status === "unavailable") {
        return result;
    }

    const payload = result.data as {
        from?: string;
        to?: string;
        count?: number;
        data?: Row[];
    };

    return {
        status: "available" as const,
        data: {
            from: payload.from ?? null,
            to: payload.to ?? null,
            count: payload.count ?? 0,
            records: (
                Array.isArray(payload.data)
                    ? payload.data
                    : []
            ).map((item) => ({
                date: item.date ?? null,
                fiiBuyCr: item.fii_buy ?? null,
                fiiSellCr: item.fii_sell ?? null,
                fiiNetCr: item.fii_net ?? null,
                diiBuyCr: item.dii_buy ?? null,
                diiSellCr: item.dii_sell ?? null,
                diiNetCr: item.dii_net ?? null,
            })),
        },
    };
}


type MutualFundPortfolio = {
    schemeName: string | null;
    fundHouse: string | null;
    latestMonth: string | null;
    holdingCount: number | null;
};

type MutualFundHolding = {
    symbol: string | null;
    companyName: string | null;
    isin: string | null;
    instrumentType: string | null;
    quantity: number | null;
    marketValueCr: number | null;
    percentageOfAum: number | null;
    quantityChange: number | null;
};

// Search schemes that have portfolio holdings available.
export async function searchMutualFundPortfolios(
    query = "",
    fundHouse = "",
    limit = 50,
    offset = 0
) {
    const result = await fetchBharatStock("/v1/mf/portfolios", {
        ...(query ? { q: query } : {}),
        ...(fundHouse ? { fund_house: fundHouse } : {}),
        limit: Math.min(200, Math.max(1, limit)),
        offset: Math.max(0, offset),
    });

    if (result.status === "unavailable") {
        return result;
    }

    const payload = result.data as {
        count?: number;
        total?: number;
        limit?: number;
        offset?: number;
        data?: Row[];
    };

    const portfolios: MutualFundPortfolio[] = (
        Array.isArray(payload.data) ? payload.data : []
    ).map((item) => ({
        schemeName:
            typeof item.scheme_name === "string"
                ? item.scheme_name
                : null,
        fundHouse:
            typeof item.fund_house === "string"
                ? item.fund_house
                : null,
        latestMonth:
            typeof item.latest_month === "string"
                ? item.latest_month
                : null,
        holdingCount:
            typeof item.holding_count === "number"
                ? item.holding_count
                : null,
    }));

    return {
        status: "available" as const,
        data: {
            portfolios,
            count: payload.count ?? portfolios.length,
            total: payload.total ?? portfolios.length,
            limit: payload.limit ?? limit,
            offset: payload.offset ?? offset,
        },
    };
}

// Retrieve a selected scheme's stock holdings.
export async function getMutualFundPortfolioHoldings(
    schemeName: string,
    page = 1,
    pageSize = 50,
    month?: string
) {
    if (!schemeName.trim()) {
        return {
            status: "unavailable" as const,
            message: "A mutual fund scheme name is required.",
        };
    }

    const endpoint =
        `/v1/mf/portfolios/${encodeURIComponent(schemeName)}/holdings`;

    const result = await fetchBharatStock(endpoint, {
        page: Math.max(1, page),
        page_size: Math.min(100, Math.max(1, pageSize)),
        ...(month ? { month } : {}),
    });

    if (result.status === "unavailable") {
        return result;
    }

    const payload = result.data as {
        scheme_name?: string;
        fund_house?: string;
        portfolio_date?: string | null;
        coverage_pct?: number | null;
        data?: Row[];
        pagination?: {
            page?: number;
            page_size?: number;
            total_items?: number;
            total_pages?: number;
        };
    };

    const holdings: MutualFundHolding[] = (
        Array.isArray(payload.data) ? payload.data : []
    ).map((item) => ({
        symbol:
            typeof item.symbol === "string" ? item.symbol : null,
        companyName:
            typeof item.company_name === "string"
                ? item.company_name
                : null,
        isin: typeof item.isin === "string" ? item.isin : null,
        instrumentType:
            typeof item.instrument_type === "string"
                ? item.instrument_type
                : null,
        quantity:
            typeof item.quantity === "number" ? item.quantity : null,
        marketValueCr:
            typeof item.market_value_cr === "number"
                ? item.market_value_cr
                : null,
        percentageOfAum:
            typeof item.pct_of_aum === "number"
                ? item.pct_of_aum
                : null,
        quantityChange:
            typeof item.quantity_change === "number"
                ? item.quantity_change
                : null,
    }));

    const pagination = payload.pagination;

    return {
        status: "available" as const,
        data: {
            schemeName: payload.scheme_name ?? schemeName,
            fundHouse: payload.fund_house ?? null,
            portfolioDate: payload.portfolio_date ?? null,
            coveragePct: payload.coverage_pct ?? null,
            holdings,
            pagination: {
                page: pagination?.page ?? page,
                pageSize: pagination?.page_size ?? pageSize,
                totalItems: pagination?.total_items ?? holdings.length,
                totalPages: pagination?.total_pages ?? 0,
            },
        },
    };
}
