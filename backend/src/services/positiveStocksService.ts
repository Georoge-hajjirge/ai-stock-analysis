import {
    getHistoricalData,
    getStockData,
    searchStocks,
} from "./stockService.js";
import { identifyPositiveStocks } from "./aiService.js";
import { getMarketNews } from "./marketNewsService.js";
import { PositiveSnapshot } from "../models/PositiveSnapshot.js";
import { formatIST, getTargetSession } from "../utils/tradingCalendar.js";
import type { PositiveStockPick } from "../types/ai.js";
import type { HistoricalStockData } from "../types/stock.js";
import type {
    Outlook,
    PositiveSignal,
    PositiveStockItem,
    PositiveStocksResult,
} from "../types/positiveStock.js";

const SNAPSHOT_VERSION = 3; // bump whenever the saved shape changes
const SNAPSHOT_KEY = "latest";
const LOOKUP_CONCURRENCY = 3;
const MAX_RESULTS = 10;
const MAX_PER_SECTOR = 2;
const MIN_SCORE = 60;
const ALREADY_MOVED_PERCENT = 5;
const EXCLUDE_BELOW_PERCENT = -2;
const MAX_ESTIMATE_PERCENT = 8;
const MAX_SNAPSHOT_AGE_MS = 6 * 60 * 60 * 1000;
const RETRY_COOLDOWN_MS = 5 * 60 * 1000;

const CATEGORY_LABEL: Record<PositiveStockPick["category"], string> = {
    company: "Company news",
    government: "Policy",
    global: "Global",
};

// --- Snapshot storage (MongoDB) ------------------------------------------

let snapshot: PositiveStocksResult | null = null;
let snapshotLoaded = false;
let pendingRefresh: Promise<PositiveStocksResult> | null = null;
let lastAttemptAt = 0;

const ensureSnapshotLoaded = async () => {
    if (snapshotLoaded) return;

    try {
        const doc = await PositiveSnapshot.findOne({ key: SNAPSHOT_KEY }).lean();
        const saved = (doc as { data?: PositiveStocksResult } | null)?.data;

        snapshot = saved?.version === SNAPSHOT_VERSION ? saved : null;
        snapshotLoaded = true;
    } catch (error) {
        // Leave snapshotLoaded false so the next call retries (e.g. DB still connecting).
        console.error("Failed to load positive stocks snapshot:", error);
    }
};

const saveSnapshot = async (data: PositiveStocksResult) => {
    await PositiveSnapshot.findOneAndUpdate(
        { key: SNAPSHOT_KEY },
        { data },
        { upsert: true }
    );
};

// A list is stale if it is old, or was built for a session that has passed.
const isStale = (data: PositiveStocksResult): boolean => {
    const age = Date.now() - new Date(data.generatedAt).getTime();

    return (
        age > MAX_SNAPSHOT_AGE_MS || data.targetDate !== getTargetSession().date
    );
};

// --- Helpers -------------------------------------------------------------

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const mapLimit = async <T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    let next = 0;

    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index]!);
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, worker)
    );

    return results;
};

const NAME_NOISE = new Set([
    "limited", "ltd", "the", "of", "and", "company", "corporation", "corp",
    "india", "indian", "inc", "pvt", "private",
]);

const nameTokens = (name: string): string[] =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 1 && !NAME_NOISE.has(token));

// Guards against a search result that is a different company.
const namesMatch = (expected: string, actual: string): boolean => {
    const a = nameTokens(expected);
    const b = new Set(nameTokens(actual));

    if (a.length === 0 || b.size === 0) return false;

    return a.filter((token) => b.has(token)).length / a.length >= 0.5;
};

const resolveSymbol = async (
    pick: PositiveStockPick
): Promise<{ symbol: string; name: string } | null> => {
    try {
        const matches = (await searchStocks(pick.companyName)).filter((stock) =>
            stock.symbol.endsWith(".NS")
        );

        if (matches.length === 0) return null;

        const hinted = pick.nseTicker ? `${pick.nseTicker}.NS` : "";
        const exact = matches.find((stock) => stock.symbol === hinted);

        if (exact) {
            return { symbol: exact.symbol, name: exact.name || pick.companyName };
        }

        const similar = matches.find((stock) =>
            namesMatch(pick.companyName, stock.name)
        );

        return similar
            ? { symbol: similar.symbol, name: similar.name || pick.companyName }
            : null;
    } catch {
        return null;
    }
};

// Volume vs the previous 20 sessions, breakout above their highs, and the
// stock's typical daily move.
const analyzeHistory = (history: HistoricalStockData[]) => {
    const candles = history
        .filter(
            (candle) =>
                typeof candle.close === "number" && typeof candle.high === "number"
        )
        .sort((a, b) => a.timestamp - b.timestamp);

    if (candles.length < 11) {
        return {
            volumeRatio: undefined,
            breakout: false,
            typicalMovePercent: undefined,
        };
    }

    const latest = candles[candles.length - 1]!;
    const previous = candles.slice(-21, -1);

    const volumes = previous
        .map((candle) => candle.volume)
        .filter((volume): volume is number => typeof volume === "number" && volume > 0);

    const avgVolume = volumes.length
        ? volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length
        : undefined;

    const volumeRatio =
        avgVolume && typeof latest.volume === "number"
            ? Number((latest.volume / avgVolume).toFixed(1))
            : undefined;

    const priorHigh = Math.max(...previous.map((candle) => candle.high!));
    const breakout = latest.close! > priorHigh;

    // Typical daily move: average absolute % change over recent completed sessions.
    const window = candles.slice(-22, -1);
    const moves: number[] = [];

    for (let i = 1; i < window.length; i++) {
        const prev = window[i - 1]!.close!;
        const curr = window[i]!.close!;

        if (prev > 0) {
            moves.push(Math.abs((curr - prev) / prev) * 100);
        }
    }

    const typicalMovePercent =
        moves.length >= 8
            ? Number(
                (moves.reduce((sum, move) => sum + move, 0) / moves.length).toFixed(2)
            )
            : undefined;

    return { volumeRatio, breakout, typicalMovePercent };
};

// Estimated next-session range: scaled to the stock's own typical daily move,
// and widened or narrowed by how strong today's signals are. A heuristic, not a forecast.
const estimateNextMove = (score: number, typicalMovePercent?: number) => {
    if (typicalMovePercent === undefined) return undefined;

    const strength = clamp((score - 60) / 50, 0, 1);
    const low = typicalMovePercent * (0.15 + 0.25 * strength);
    const high = typicalMovePercent * (0.5 + 0.7 * strength);

    return {
        low: Number(Math.min(low, MAX_ESTIMATE_PERCENT).toFixed(1)),
        high: Number(Math.min(high, MAX_ESTIMATE_PERCENT).toFixed(1)),
    };
};

const outlookLabel = (score: number): Outlook =>
    score >= 95 ? "Strong" : score >= 78 ? "Moderate" : "Mild";

// --- Build the list ------------------------------------------------------

const computeItems = async (): Promise<PositiveStocksResult> => {
    const now = new Date();
    const target = getTargetSession(now);
    const articles = await getMarketNews();

    const picks = await identifyPositiveStocks(articles, {
        currentTimeIST: formatIST(now),
        targetSession: target.label,
    });

    const unresolved: string[] = [];

    const built = await mapLimit(picks, LOOKUP_CONCURRENCY, async (pick) => {
        const match = await resolveSymbol(pick);

        if (!match) {
            unresolved.push(pick.companyName);
            return null;
        }

        const [quote, history] = await Promise.all([
            getStockData(match.symbol).catch(() => undefined),
            getHistoricalData(match.symbol, "1M").catch(() => []),
        ]);

        const price = quote?.price;
        const changePercent = quote?.changePercent;
        const high = quote?.high;
        const low = quote?.low;

        const closeStrength =
            typeof price === "number" &&
                typeof high === "number" &&
                typeof low === "number" &&
                high > low
                ? (price - low) / (high - low)
                : undefined;

        const { volumeRatio, breakout, typicalMovePercent } =
            analyzeHistory(history);

        // Score: news confidence first, then price and volume confirmation.
        let score = pick.confidence;
        const signals: PositiveSignal[] = [
            { kind: "news", label: CATEGORY_LABEL[pick.category] },
        ];

        if (typeof changePercent === "number") {
            if (changePercent > 0) {
                score += Math.min(changePercent, 4) * 2;
            } else {
                score += changePercent * 3;
            }

            if (changePercent >= ALREADY_MOVED_PERCENT) {
                score -= 15;
                signals.push({
                    kind: "warning",
                    label: `Already up ${changePercent.toFixed(1)}%`,
                });
            }

            if (
                changePercent > 0 &&
                closeStrength !== undefined &&
                closeStrength >= 0.8
            ) {
                score += 5;
                signals.push({ kind: "momentum", label: "Near session high" });
            }
        }

        if (volumeRatio !== undefined && volumeRatio >= 1.5) {
            score += volumeRatio >= 2.5 ? 10 : 6;
            signals.push({
                kind: "momentum",
                label: `Volume ${volumeRatio}x average`,
            });
        }

        if (breakout) {
            score += 6;
            signals.push({ kind: "momentum", label: "1-month high breakout" });
        }

        const finalScore = Math.round(score);

        const item: PositiveStockItem = {
            symbol: match.symbol,
            name: match.name,
            sector: pick.sector,
            price,
            changePercent,
            score: finalScore,
            outlook: outlookLabel(finalScore),
            typicalMovePercent,
            expectedMove: estimateNextMove(finalScore, typicalMovePercent),
            confidence: pick.confidence,
            reason: pick.reason,
            signals,
            articles: pick.articleIds.map((id) => ({
                title: articles[id]!.title,
                url: articles[id]!.url,
                source: articles[id]!.source,
                publishedAt: articles[id]!.publishedAt,
            })),
        };

        return item;
    });

    // Two picks can resolve to the same symbol; keep the stronger one.
    const bySymbol = new Map<string, PositiveStockItem>();

    for (const item of built) {
        if (!item) continue;

        const existing = bySymbol.get(item.symbol);

        if (!existing || item.score > existing.score) {
            bySymbol.set(item.symbol, item);
        }
    }

    const sorted = Array.from(bySymbol.values())
        .filter(
            (item) =>
                item.changePercent === undefined ||
                item.changePercent > EXCLUDE_BELOW_PERCENT
        )
        .filter((item) => item.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score);

    // Keep the list varied: at most MAX_PER_SECTOR stocks from one sector.
    const perSector = new Map<string, number>();

    const items = sorted
        .filter((item) => {
            const key = item.sector.toLowerCase() || "other";
            const count = perSector.get(key) ?? 0;

            if (count >= MAX_PER_SECTOR) return false;

            perSector.set(key, count + 1);
            return true;
        })
        .slice(0, MAX_RESULTS);

    return {
        version: SNAPSHOT_VERSION,
        generatedAt: now.toISOString(),
        targetDate: target.date,
        targetSession: target.label,
        articlesAnalyzed: articles.length,
        picksFromAI: picks.length,
        unresolved,
        items,
    };
};

// --- Public API ----------------------------------------------------------

// Rebuilds the snapshot. A failed run keeps the previous snapshot.
export const refreshPositiveStocks = async (): Promise<PositiveStocksResult> => {
    if (pendingRefresh) return pendingRefresh;

    lastAttemptAt = Date.now();

    pendingRefresh = computeItems()
        .then(async (data) => {
            snapshot = data;
            await saveSnapshot(data).catch((error) =>
                console.error("Failed to save positive stocks snapshot:", error)
            );
            return data;
        })
        .finally(() => {
            pendingRefresh = null;
        });

    return pendingRefresh;
};

// What the dashboard calls. Always answers from the saved list; a stale list
// is rebuilt in the background so the next visitor gets fresh data.
export const getPositiveStocks = async (): Promise<PositiveStocksResult> => {
    await ensureSnapshotLoaded();

    if (!snapshot) {
        return refreshPositiveStocks();
    }

    if (isStale(snapshot) && Date.now() - lastAttemptAt > RETRY_COOLDOWN_MS) {
        refreshPositiveStocks().catch((error) =>
            console.error("Background positive stocks refresh failed:", error)
        );
    }

    return snapshot;
};

// Called at startup (and by the scheduled job when the server stays awake).
export const warmPositiveStocks = async () => {
    await ensureSnapshotLoaded();

    if (!snapshot || isStale(snapshot)) {
        await refreshPositiveStocks();
    }
};