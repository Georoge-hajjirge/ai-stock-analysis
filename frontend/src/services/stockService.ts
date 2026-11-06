import { ChatMessage } from "../components/AIQuestionPanel";
import type {
    StockData,
    StockSearchResult,
    HistoricalStockData,
    StockFundamentals,
    StockPeriod,
    NewsArticle,
    PositiveStocksResult,
} from "../types/stock";

const API_BASE_URL =
    `${import.meta.env.VITE_API_BASE_URL}/stocks`;
export const searchStocks = async (
    query: string
): Promise<StockSearchResult[]> => {
    const response = await fetch(
        `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to search stocks");
    }

    return data.data;
};

export const getStockData = async (
    symbol: string
): Promise<StockData> => {
    console.log("[getStockData] Received symbol:", symbol);

    const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(symbol)}`
    );
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to get stock data");
    }

    return data.data;
};

export const getHistoricalData = async (
    symbol: string,
    period: StockPeriod = "1M"
): Promise<HistoricalStockData[]> => {
    const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(symbol)}/history?period=${period}`
    );
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to get historical data");
    }

    return data.data;
};

export const getFundamentals = async (
    symbol: string
): Promise<StockFundamentals> => {
    const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(symbol)}/fundamentals`
    );
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to get fundamentals");
    }

    return data.data;
};

export const getStockNews = async (
    symbol: string
): Promise<NewsArticle[]> => {
    const response = await fetch(
        `${API_BASE_URL.replace("/stocks", "/news")}/${encodeURIComponent(symbol)}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Failed to get stock news"
        );
    }

    return data.data;
};

export const getAIStockAnalysis = async (
    symbol: string
): Promise<string> => {
    const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(
            symbol
        )}/ai-analysis`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Failed to generate AI analysis"
        );
    }

    return data.data;
};


export const askAIStockQuestion = async (
    symbol: string,
    question: string,
    messages: ChatMessage[] = []

): Promise<string> => {
    const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(
            symbol
        )}/ai-question`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                question,
                messages,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Failed to answer stock question"
        );
    }

    return data.data;
};


export interface StockComparisonItem {
    symbol: string;
    stock: StockData;
    fundamentals: StockFundamentals | null;
    historicalPerformance: {
        earliestDate: string | null;
        earliestClose: number | null;
        latestDate: string | null;
        latestClose: number | null;
        changePercent: number | null;
        observations: number;
    };
    news: NewsArticle[];
}

export interface StockComparisonResponse {
    success: boolean;
    data: StockComparisonItem[];
    aiAnalysis: string;
    unavailableSymbols: string[];
}

export const compareStocks = async (
    symbols: string[]
): Promise<StockComparisonResponse> => {
    const response = await fetch(`${API_BASE_URL}/compare`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbols }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Failed to compare stocks"
        );
    }

    return data as StockComparisonResponse;
};

export const getPositiveStocks = async (): Promise<PositiveStocksResult> => {
    const response = await fetch(`${API_BASE_URL}/insights/positive`);

    if (!response.ok) {
        throw new Error("Failed to load stocks to watch");
    }

    const json = await response.json();
    return json.data as PositiveStocksResult;
};