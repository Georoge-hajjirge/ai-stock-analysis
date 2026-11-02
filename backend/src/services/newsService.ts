
import axios from "axios";
import { getStockData } from "./stockService.js";
import { analyzeStockNews } from "./aiService.js";

const NEWS_API_URL = "https://newsapi.org/v2/everything";
const newsApiKey = process.env.NEWS_API_KEY;

const DEFAULT_DOMAINS = [
    "economictimes.indiatimes.com",
    "business-standard.com",
    "livemint.com",
    "thehindubusinessline.com",
    "moneycontrol.com",
    "financialexpress.com",
].join(",");

const CONTEXT_WORDS = [
    "share",
    "shares",
    "stock",
    "stocks",
    "results",
    "earnings",
    "dividend",
    "revenue",
    "profit",
    "quarter",
];

const MACRO_NEWS_TERMS = [
    '"Reserve Bank of India"',
    "RBI",
    "SEBI",
    '"Union Budget"',
    '"interest rates"',
    '"repo rate"',
    "taxation",
    "regulation",
    '"crude oil"',
    '"oil prices"',
    '"global economy"',
    '"US markets"',
    '"China economy"',
    '"foreign exchange"',
    '"global demand"',
];

const COMPANY_SUFFIX =
    /\b(limited|ltd\.?|corporation|corp\.?|incorporated|inc\.?|plc)\s*$/i;

const CACHE_MINUTES = 10;
const MAX_ARTICLES = 10;
const MIN_RELEVANCE_SCORE = 60;

export type NewsCategory = "company" | "government" | "global";
export type NewsImportance = "high" | "normal";
export type NewsImpact = "positive" | "negative" | "mixed" | "uncertain";

export interface NewsCandidate {
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    imageUrl?: string;
}

export interface NewsArticle extends NewsCandidate {
    category: NewsCategory;
    importance: NewsImportance;
    impact: NewsImpact;
    reason: string;
    relevanceScore: number;
}

const cache = new Map<
    string,
    { expires: number; data: NewsArticle[] }
>();

const escapeRegex = (text: string): string =>
    text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const cleanCompanyName = (name: string): string =>
    name.replace(COMPANY_SUFFIX, "").replace(/[.,\s]+$/, "").trim();

export const buildNewsQuery = (
    companyName: string,
    symbolBase: string
): string => {
    const parts: string[] = [];

    if (companyName.length >= 3) {
        parts.push(`"${companyName}"`);
    }

    if (symbolBase.length >= 2) {
        parts.push(
            `("${symbolBase}" AND (${CONTEXT_WORDS.join(" OR ")}))`
        );
    }

    // Also retrieve government and global market news.
    // Gemini will decide whether each article could affect this stock.
    parts.push(`(${MACRO_NEWS_TERMS.join(" OR ")})`);

    return `(${parts.join(" OR ")})`;
};

export const isRelevant = (
    article: Pick<NewsCandidate, "title" | "description">,
    companyName: string,
    symbolBase: string
): boolean => {
    const text = `${article.title} ${article.description}`.toLowerCase();

    const nameHit =
        companyName.length >= 3 &&
        text.includes(companyName.toLowerCase());

    const symbolHit =
        symbolBase.length >= 2 &&
        new RegExp(`\\b${escapeRegex(symbolBase)}\\b`, "i").test(text);

    return nameHit || symbolHit;
};

export const getStockNews = async (
    symbol: string
): Promise<NewsArticle[]> => {
    const trimmedSymbol = symbol.trim().toUpperCase();

    if (!trimmedSymbol) {
        throw new Error("Stock symbol is required");
    }

    if (!newsApiKey) {
        throw new Error("NEWS_API_KEY is not configured");
    }

    const cached = cache.get(trimmedSymbol);

    if (cached && cached.expires > Date.now()) {
        return cached.data;
    }

    const symbolBase = trimmedSymbol.replace(/\.(NS|BO)$/, "");

    let companyName = "";

    try {
        const stock = await getStockData(trimmedSymbol);

        if (stock.name) {
            companyName = cleanCompanyName(stock.name);
        }
    } catch {
        // Continue with the stock symbol if company lookup fails.
    }

    const query = buildNewsQuery(companyName, symbolBase);

    try {
        const response = await axios.get(NEWS_API_URL, {
            params: {
                q: query,
                searchIn: "title,description",
                domains: process.env.NEWS_DOMAINS || DEFAULT_DOMAINS,
                from: new Date(
                    Date.now() - 30 * 24 * 60 * 60 * 1000
                )
                    .toISOString()
                    .slice(0, 10),
                language: "en",
                sortBy: "publishedAt",
                pageSize: 15,
                apiKey: newsApiKey,
            },
            timeout: 15000,
        });

        const articles = response.data?.articles;

        if (!Array.isArray(articles)) {
            return [];
        }

        const seen = new Set<string>();

        const candidates: NewsCandidate[] = articles
            .map((article: Record<string, unknown>): NewsCandidate => {
                const source = article.source as
                    | Record<string, unknown>
                    | undefined;

                return {
                    title:
                        typeof article.title === "string" ? article.title : "",
                    description:
                        typeof article.description === "string"
                            ? article.description
                            : "",
                    url: typeof article.url === "string" ? article.url : "",
                    source:
                        typeof source?.name === "string" ? source.name : "",
                    publishedAt:
                        typeof article.publishedAt === "string"
                            ? article.publishedAt
                            : "",
                    imageUrl:
                        typeof article.urlToImage === "string"
                            ? article.urlToImage
                            : undefined,
                };
            })
            .filter(
                (article) =>
                    article.title &&
                    article.url &&
                    article.title !== "[Removed]" &&
                    article.description !== "[Removed]"
            )
            .filter((article) => {
                const urlKey = article.url.trim();
                const titleKey = article.title.toLowerCase().trim();

                if (seen.has(urlKey) || seen.has(titleKey)) {
                    return false;
                }

                seen.add(urlKey);
                seen.add(titleKey);
                return true;
            });

        if (candidates.length === 0) {
            cache.set(trimmedSymbol, {
                expires: Date.now() + CACHE_MINUTES * 60 * 1000,
                data: [],
            });

            return [];
        }

        // Gemini classifies articles and filters out news that is not
        // meaningfully relevant to the selected stock.
        const analyzedArticles = await analyzeStockNews({
            symbol: trimmedSymbol,
            companyName: companyName || symbolBase,
            articles: candidates,
        });

        const result = analyzedArticles
            .filter(
                (article) => article.relevanceScore >= MIN_RELEVANCE_SCORE
            )
            .sort(
                (a, b) =>
                    new Date(b.publishedAt).getTime() -
                    new Date(a.publishedAt).getTime()
            )
            .slice(0, MAX_ARTICLES);

        cache.set(trimmedSymbol, {
            expires: Date.now() + CACHE_MINUTES * 60 * 1000,
            data: result,
        });

        return result;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(
                "News API error:",
                error.response?.data || error.message
            );
        } else {
            console.error("Stock news processing error:", error);
        }

        throw new Error(`Failed to get news for ${trimmedSymbol}`);
    }
};
