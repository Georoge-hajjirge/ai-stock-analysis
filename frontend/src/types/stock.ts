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
    | "1Y";

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

export interface NewsArticle {
    title: string;
    description?: string;
    url: string;
    source: string;
    publishedAt: string;
    imageUrl?: string;
}

export interface WatchlistItem {
    symbol: string;
    name: string;
    exchange: string;
    addedAt: number;
}

export type PriceAlertCondition = "above" | "below";

export interface PriceAlert {
    id: string;
    symbol: string;
    name: string;
    targetPrice: number;
    condition: PriceAlertCondition;
    isActive: boolean;
    isTriggered: boolean;
    createdAt: number;
    triggeredAt?: number;
}
