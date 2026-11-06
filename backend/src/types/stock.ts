export interface StockSearchResult {
    symbol: string;
    name: string;
    exchange: string;
    exchangeDisplayName?: string;
    type: string;
}

export interface StockData {
    symbol: string;
    name?: string;
    exchange?: string;
    currency?: string;
    price?: number;
    previousClose?: number;
    change?: number;
    changePercent?: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    timestamp?: number;
}

export interface HistoricalStockData {
    timestamp: number;
    date: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
}

export type StockPeriod =
    | "1D"
    | "1W"
    | "1M"
    | "6M"
    | "1Y"
    | "5Y"
    | "ALL";

export interface StockFundamentals {
    symbol: string;
    price?: number;
    marketCap?: number;
    sharesOutstanding?: number;
    trailingPE?: number;
    priceToBook?: number;
    bookValuePerShare?: number;
    eps?: number;
    returnOnEquity?: number;
    returnOnCapitalEmployed?: number;
    dividendYield?: number;
    faceValue?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    asOfDate?: string;
    financialsPeriodType?: string;
    financialsFiscalYear?: string;
}


export interface YahooSession {
    cookieHeader: string;
    crumb: string;
    expiresAt: number;
}

export interface YahooValue {
    raw?: number;
}

export interface MarketQuote {
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

export interface MarketIndexConfig {
    symbol: string;
    name: string;
}

export interface CountryMarketConfig {
    name: string;
    indices: MarketIndexConfig[];
    featuredStocks: string[];
}

export interface YahooMarketChartResult {
    meta?: Record<string, unknown>;
    timestamp?: number[];
    indicators?: {
        quote?: Array<{
            close?: (number | null)[];
        }>;
    };
}

export interface YahooMarketChartResponse {
    chart?: {
        result?: YahooMarketChartResult[];
        error?: unknown;
    };
}

