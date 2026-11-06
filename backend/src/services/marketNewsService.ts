import Parser from "rss-parser";
import { NewsCandidate } from "../types/news.js";

const NEWS_WINDOW_HOURS = 36;
const CACHE_MS = 10 * 60 * 1000;
const MAX_ARTICLES = 100;

const FEEDS = [
    { source: "Economic Times", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms" },
    { source: "Economic Times", url: "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms" },
    { source: "Mint", url: "https://www.livemint.com/rss/markets" },
];

const parser = new Parser({
    timeout: 10000,
    headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StockNewsBot/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml",
    },
});

let cache: { expiresAt: number; data: NewsCandidate[] } | null = null;

const clean = (text: string): string =>
    text
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300);

const toIso = (value?: string): string => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const fetchFeed = async (feed: { source: string; url: string }): Promise<NewsCandidate[]> => {
    const result = await parser.parseURL(feed.url);

    return result.items.map((item) => ({
        title: (item.title ?? "").trim(),
        description: clean(item.contentSnippet ?? item.content ?? item.summary ?? ""),
        url: item.link ?? "",
        source: feed.source,
        publishedAt: toIso(item.isoDate ?? item.pubDate),
    }));
};

const fetchMarketNews = async (): Promise<NewsCandidate[]> => {
    const settled = await Promise.allSettled(FEEDS.map(fetchFeed));

    settled.forEach((result, index) => {
        if (result.status === "rejected") {
            console.warn(
                `RSS feed failed: ${FEEDS[index]!.url}`,
                result.reason instanceof Error ? result.reason.message : result.reason
            );
        }
    });

    if (settled.every((result) => result.status === "rejected")) {
        throw new Error("All RSS feeds failed");
    }

    const cutoff = Date.now() - NEWS_WINDOW_HOURS * 60 * 60 * 1000;
    const seen = new Set<string>();

    return settled
        .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
        .filter(
            (article) =>
                article.title &&
                article.url &&
                article.publishedAt &&
                new Date(article.publishedAt).getTime() >= cutoff
        )
        .filter((article) => {
            const key = article.title.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort(
            (a, b) =>
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        )
        .slice(0, MAX_ARTICLES);
};

export const getMarketNews = async (): Promise<NewsCandidate[]> => {
    if (cache && cache.expiresAt > Date.now()) {
        return cache.data;
    }

    const data = await fetchMarketNews();
    cache = { expiresAt: Date.now() + CACHE_MS, data };
    return data;
};