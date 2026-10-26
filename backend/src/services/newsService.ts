import axios from "axios";
import { getStockData } from "./stockService.js";

const NEWS_API_URL = "https://newsapi.org/v2/everything";
const newsApiKey = process.env.NEWS_API_KEY || "23c58bdacc07409fadd7a1d9aaf035ef";
// Indian business news sites. This keeps out unrelated articles (cars, science, weather ...).
// You can override the list in .env with NEWS_DOMAINS=site1.com,site2.com
const DEFAULT_DOMAINS = [
    "economictimes.indiatimes.com",
    "business-standard.com",
    "livemint.com",
    "thehindubusinessline.com",
    "moneycontrol.com",
    "financialexpress.com",
].join(",");

// "TCS" also means "Tax Collected at Source" in Indian news, so a short symbol
// only counts when the article also talks about markets or company results.
const CONTEXT_WORDS = [
    "share", "shares", "stock", "stocks", "results", "earnings",
    "dividend", "Sensex", "Nifty", "revenue", "profit", "quarter",
];

const COMPANY_SUFFIX = /\b(limited|ltd\.?|corporation|corp\.?|incorporated|inc\.?|plc)\s*$/i;

const CACHE_MINUTES = 10; // saves your NewsAPI request limit
const cache = new Map<string, { expires: number; data: NewsArticle[] }>();

export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    imageUrl?: string;
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "Tata Consultancy Services Limited" -> "Tata Consultancy Services"
export const cleanCompanyName = (name: string): string =>
    name.replace(COMPANY_SUFFIX, "").replace(/[.,\s]+$/, "").trim();

// Builds a NewsAPI search such as:
// ("Tata Consultancy Services" OR ("TCS" AND (share OR shares OR stock ...)))
export const buildNewsQuery = (companyName: string, symbolBase: string): string => {
    const parts: string[] = [];

    if (companyName.length >= 3) {
        parts.push(`"${companyName}"`);
    }

    if (symbolBase.length >= 2) {
        parts.push(`("${symbolBase}" AND (${CONTEXT_WORDS.join(" OR ")}))`);
    }

    if (parts.length === 0) return "";
    return parts.length === 1 ? parts[0] : `(${parts.join(" OR ")})`;
};

// Second safety check on our side: keep only articles that really mention the company.
export const isRelevant = (
    article: Pick<NewsArticle, "title" | "description">,
    companyName: string,
    symbolBase: string
): boolean => {
    const text = `${article.title} ${article.description}`.toLowerCase();

    const nameHit = companyName.length >= 3 && text.includes(companyName.toLowerCase());

    const symbolHit =
        symbolBase.length >= 2 &&
        new RegExp(`\\b${escapeRegex(symbolBase.toLowerCase())}\\b`).test(text);

    const contextHit = CONTEXT_WORDS.some((word) => text.includes(word.toLowerCase()));

    return nameHit || (symbolHit && contextHit);
};

export const getStockNews = async (symbol: string): Promise<NewsArticle[]> => {
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

    // Company name from Yahoo. If that fails, we still search using the symbol.
    let companyName = "";
    try {
        const stock = await getStockData(trimmedSymbol);
        if (stock.name) companyName = cleanCompanyName(stock.name);
    } catch {
        // keep going with the symbol only
    }

    const q = buildNewsQuery(companyName, symbolBase);

    if (!q) {
        return [];
    }

    try {
        const response = await axios.get(NEWS_API_URL, {
            params: {
                q,
                searchIn: "title,description",
                domains: process.env.NEWS_DOMAINS || DEFAULT_DOMAINS,
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                language: "en",
                sortBy: "publishedAt",
                pageSize: 30,
                apiKey: newsApiKey,
            },
            timeout: 15000,
        });

        const articles = response.data?.articles;

        if (!Array.isArray(articles)) {
            return [];
        }

        const seen = new Set<string>();

        const result = articles
            .map((article: Record<string, unknown>): NewsArticle => {
                const source = article.source as Record<string, unknown> | undefined;

                return {
                    title: typeof article.title === "string" ? article.title : "",
                    description: typeof article.description === "string" ? article.description : "",
                    url: typeof article.url === "string" ? article.url : "",
                    source: typeof source?.name === "string" ? source.name : "",
                    publishedAt: typeof article.publishedAt === "string" ? article.publishedAt : "",
                    imageUrl: typeof article.urlToImage === "string" ? article.urlToImage : "",
                };
            })
            // remove empty or deleted articles
            .filter((a) => a.title && a.url && a.title !== "[Removed]")
            // keep only articles that really mention this company
            .filter((a) => isRelevant(a, companyName, symbolBase))
            // remove duplicates (same link or same title)
            .filter((a) => {
                const key = a.url || a.title.toLowerCase();
                const titleKey = a.title.toLowerCase();
                if (seen.has(key) || seen.has(titleKey)) return false;
                seen.add(key);
                seen.add(titleKey);
                return true;
            })
            .slice(0, 10);

        cache.set(trimmedSymbol, { expires: Date.now() + CACHE_MINUTES * 60 * 1000, data: result });

        return result;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("News API error:", error.response?.data || error.message);
        } else {
            console.error("News API error:", error);
        }

        throw new Error(`Failed to get news for ${trimmedSymbol}`);
    }
};