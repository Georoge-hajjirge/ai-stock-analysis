
import type {
    NewsArticle,
    NewsCandidate,
    NewsCategory,
} from "./news.js";

import type {
    HistoricalStockData,
    StockData,
    StockFundamentals,
} from "./stock.js";

import type {
    InvestmentScenario,
    ParsedInvestmentRequest,
} from "./investment.js";

export interface AnalyzeStockNewsInput {
    symbol: string;
    companyName: string;
    articles: NewsCandidate[];
}

export interface AIStockAnalysisInput {
    stock: StockData;
    fundamentals: StockFundamentals | null;
    historicalData: HistoricalStockData[];
    news: NewsArticle[];
}

export interface AIStockComparisonItem {
    symbol: string;
    stock: StockData;
    history: HistoricalStockData[];
    fundamentals: StockFundamentals | null;
    news: NewsArticle[];
}

export interface AIStockQuestionInput {
    stock: StockData;
    fundamentals: StockFundamentals | null;
    historicalData: HistoricalStockData[];
    news: NewsArticle[];
    question: string;
    investmentRequest?: ParsedInvestmentRequest;
    investmentScenario?: InvestmentScenario;
}

export interface PositiveStockPick {
    companyName: string;
    nseTicker: string;
    sector: string;
    category: NewsCategory;
    confidence: number;
    reason: string;
    articleIds: number[];
}

export interface PositiveStocksContext {
    currentTimeIST: string;
    targetSession: string;
}
