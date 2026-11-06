
import type {
    StockData,
    StockSearchResult,
    HistoricalStockData,
    StockFundamentals,
    StockPeriod,
} from "../types/stock";

const API_BASE_URL =
    `${import.meta.env.VITE_API_BASE_URL}/international-stocks`;

export const searchInternationalStocks = async (
    query: string,
    country: string
): Promise<StockSearchResult[]> => {
    const params = new URLSearchParams({
        query,
        country,
    });

    const response = await fetch(
        `${API_BASE_URL}/search?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to search international stocks");
    }

    return data.data;
};

export const getInternationalStockData = async (
    symbol: string
): Promise<StockData> => {
    const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(symbol)}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to get international stock data");
    }

    return data.data;
};

export const getInternationalHistoricalData = async (
    symbol: string,
    period: StockPeriod = "1M"
): Promise<HistoricalStockData[]> => {
    const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(symbol)}/history?period=${period}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to get international historical data");
    }

    return data.data;
};

export const getInternationalFundamentals = async (
    symbol: string
): Promise<StockFundamentals> => {
    const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(symbol)}/fundamentals`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to get international fundamentals");
    }

    return data.data;
};
export interface InternationalMarketQuote {
    symbol: string;
    name: string;
    exchange?: string;
    currency?: string;
    price?: number;
    previousClose?: number;
    change?: number;
    changePercent?: number;
    timestamp?: number;
    marketState?: string;
}

export interface InternationalMarketOverview {
    country: string;
    countryName: string;
    indices: InternationalMarketQuote[];
    featuredStocks: InternationalMarketQuote[];
    updatedAt: string | null;
}


export const getInternationalMarketOverview = async (
    country: string
): Promise<InternationalMarketOverview> => {
    const response = await fetch(
        `${API_BASE_URL}/market/${encodeURIComponent(country)}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Failed to get international market overview"
        );
    }

    return data.data;
};
