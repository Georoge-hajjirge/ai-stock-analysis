
export interface PositiveStocksResult {
    generatedAt: string;
    targetSession: string;
    articlesAnalyzed: number;
    picksFromAI: number;
    unresolved: string[];
    items: PositiveStockItem[];
}
export type SignalKind = "news" | "momentum" | "warning";
export type Outlook = "Strong" | "Moderate" | "Mild";

export interface PositiveSignal {
    kind: SignalKind;
    label: string;
}

export interface PositiveStockItem {
    symbol: string;
    name: string;
    sector: string;
    price?: number;
    changePercent?: number; // today's (latest session) change
    score: number;
    outlook: Outlook;
    typicalMovePercent?: number; // average absolute daily move, last 20 sessions
    expectedMove?: { low: number; high: number }; // estimated next-session % range
    confidence: number;
    reason: string;
    signals: PositiveSignal[];
    articles: {
        title: string;
        url: string;
        source: string;
        publishedAt: string;
    }[];
}

export interface PositiveStocksResult {
    version: number;
    generatedAt: string;
    targetDate: string; // YYYY-MM-DD of the session this list is for
    targetSession: string;
    articlesAnalyzed: number;
    picksFromAI: number;
    unresolved: string[];
    items: PositiveStockItem[];
}

