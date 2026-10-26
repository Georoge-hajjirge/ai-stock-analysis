
import type {
    FiiDiiResponse,
    InvestorPage,
    InvestorTransaction,
} from "../types/investorIntelligence";

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

async function requestInvestorData<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.data?.message ||
            result.message ||
            "Unable to load investor data."
        );
    }

    const providerResult = result.data;

    if (providerResult?.status === "unavailable") {
        throw new Error(
            providerResult.message || "Investor data is unavailable."
        );
    }

    return providerResult as T;
}

function pageQuery(page: number, pageSize: number) {
    return new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });
}

export function fetchFiiDiiActivity(from?: string, to?: string) {
    const params = new URLSearchParams();

    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const query = params.toString();

    return requestInvestorData<FiiDiiResponse>(
        `/investor-intelligence/market/fii-dii${query ? `?${query}` : ""}`
    );
}

export function fetchMarketBulkDeals(
    page = 1,
    pageSize = 20,
    buySell?: "BUY" | "SELL"
) {
    const params = pageQuery(page, pageSize);

    if (buySell) params.set("buySell", buySell);

    return requestInvestorData<InvestorPage<InvestorTransaction>>(
        `/investor-intelligence/market/bulk-deals?${params.toString()}`
    );
}

export function fetchMarketBlockDeals(
    page = 1,
    pageSize = 20,
    buySell?: "BUY" | "SELL"
) {
    const params = pageQuery(page, pageSize);

    if (buySell) params.set("buySell", buySell);

    return requestInvestorData<InvestorPage<InvestorTransaction>>(
        `/investor-intelligence/market/block-deals?${params.toString()}`
    );
}

export function fetchMarketInsiderTrades(
    page = 1,
    pageSize = 20,
    transactionType?: "acquisition" | "disposal",
    promotersOnly = false
) {
    const params = pageQuery(page, pageSize);

    if (transactionType) {
        params.set("transactionType", transactionType);
    }

    if (promotersOnly) {
        params.set("promotersOnly", "true");
    }

    return requestInvestorData<InvestorPage<InvestorTransaction>>(
        `/investor-intelligence/market/insider-trades?${params.toString()}`
    );
}


export interface MutualFundScheme {
    schemeName: string;
    fundHouse: string;
    latestMonth: string | null;
    holdingCount: number;
}

export interface MutualFundSchemesResponse {
    portfolios: MutualFundScheme[];
    count: number;
    total: number;
    limit: number;
    offset: number;
}

export interface MutualFundHolding {
    symbol: string | null;
    companyName: string | null;
    isin: string | null;
    instrumentType: string | null;
    quantity: number | null;
    marketValueCr: number | null;
    percentageOfAum: number | null;
    quantityChange: number | null;
}

export interface MutualFundHoldingsResponse {
    schemeName: string;
    fundHouse: string;
    portfolioDate: string | null;
    coveragePct: number | null;
    holdings: MutualFundHolding[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
}

export function fetchMutualFundPortfolios(
    query = "",
    fundHouse = "",
    limit = 50,
    offset = 0
) {
    const params = new URLSearchParams({
        q: query,
        fundHouse,
        limit: String(limit),
        offset: String(offset),
    });

    return requestInvestorData<MutualFundSchemesResponse>(
        `/investor-intelligence/mutual-funds/portfolios?${params.toString()}`
    );
}

export function fetchMutualFundHoldings(
    schemeName: string,
    page = 1,
    pageSize = 50
) {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });

    return requestInvestorData<MutualFundHoldingsResponse>(
        `/investor-intelligence/mutual-funds/portfolios/${encodeURIComponent(
            schemeName
        )}/holdings?${params.toString()}`
    );
}