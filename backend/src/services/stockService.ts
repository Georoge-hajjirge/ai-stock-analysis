import axios from "axios";
const YAHOO_SEARCH_URL = process.env.YAHOO_SEARCH_URL;
const YAHOO_CHART_URL =
    process.env.YAHOO_CHART_URL;

const BHARATSTOCK_BASE_URL =
    process.env.BHARATSTOCK_BASE_URL;

const BHARATSTOCK_API_KEY =
    process.env.BHARATSTOCK_API_KEY;
const YAHOO_API_TIMEOUT = Number(process.env.YAHOO_API_TIMEOUT || 15000);


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

export type StockPeriod = "1D" | "1W" | "1M" | "6M" | "1Y";
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


const getPeriodConfig = (period: StockPeriod) => {
    switch (period) {
        case "1D":
            return { range: "1d", interval: "5m" };
        case "1W":
            return { range: "5d", interval: "15m" };
        case "1M":
            return { range: "1mo", interval: "1d" };
        case "6M":
            return { range: "6mo", interval: "1d" };
        case "1Y":
            return { range: "1y", interval: "1d" };
        default:
            return { range: "1mo", interval: "1d" };
    }
};

export const searchStocks = async (
    query: string
): Promise<StockSearchResult[]> => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) return [];
    if (!YAHOO_SEARCH_URL) return [];

    try {
        const response = await axios.get(YAHOO_SEARCH_URL, {
            params: {
                q: trimmedQuery,
                quotesCount: 10,
                newsCount: 0,
                listsCount: 0,
            },
            timeout: YAHOO_API_TIMEOUT,
        });

        const quotes = response.data?.quotes;

        if (!Array.isArray(quotes)) return [];

        return quotes
            .filter((item: Record<string, unknown>) => {
                const isStock = item.quoteType === "EQUITY";
                const symbol =
                    typeof item.symbol === "string" ? item.symbol : "";
                const isIndianStock =
                    symbol.endsWith(".NS") || symbol.endsWith(".BO");

                return isStock && isIndianStock;
            })
            .map((item: Record<string, unknown>) => ({
                symbol:
                    typeof item.symbol === "string"
                        ? item.symbol
                        : "",
                name:
                    typeof item.longname === "string"
                        ? item.longname
                        : typeof item.shortname === "string"
                            ? item.shortname
                            : typeof item.symbol === "string"
                                ? item.symbol
                                : "",
                exchange:
                    typeof item.exchange === "string"
                        ? item.exchange
                        : "",
                exchangeDisplayName:
                    typeof item.exchDisp === "string"
                        ? item.exchDisp
                        : typeof item.fullExchangeName === "string"
                            ? item.fullExchangeName
                            : "",
                type:
                    typeof item.quoteType === "string"
                        ? item.quoteType
                        : "EQUITY",
            }));
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(
                "Yahoo Finance search error:",
                error.response?.data || error.message
            );
        } else {
            console.error("Yahoo Finance search error:", error);
        }

        throw new Error("Failed to search stocks");
    }
};

export const getStockData = async (
    symbol: string
): Promise<StockData> => {
    const trimmedSymbol = symbol.trim().toUpperCase();

    if (!trimmedSymbol) {
        throw new Error("Stock symbol is required");
    }

    try {
        const response = await axios.get(
            `${YAHOO_CHART_URL}/${encodeURIComponent(trimmedSymbol)}`,
            {
                params: {
                    range: "1d",
                    interval: "1d",
                    events: "div,splits",
                },
                timeout: YAHOO_API_TIMEOUT,
            }
        );

        const result = response.data?.chart?.result?.[0];

        if (!result) {
            throw new Error(`Stock not found: ${trimmedSymbol}`);
        }

        const meta = result.meta || {};
        const quote = result.indicators?.quote?.[0] || {};
        const prices = quote.close || [];

        const lastPrice =
            prices.length > 0
                ? prices[prices.length - 1]
                : meta.regularMarketPrice;

        const previousClose =
            meta.previousClose ?? meta.chartPreviousClose;

        const change =
            typeof lastPrice === "number" &&
                typeof previousClose === "number"
                ? lastPrice - previousClose
                : undefined;

        const changePercent =
            typeof change === "number" &&
                typeof previousClose === "number" &&
                previousClose !== 0
                ? (change / previousClose) * 100
                : undefined;

        return {
            symbol: meta.symbol || trimmedSymbol,
            name: meta.longName || meta.shortName,
            exchange: meta.exchangeName,
            currency: meta.currency,
            price: lastPrice,
            previousClose,
            change,
            changePercent,
            open: quote.open?.[quote.open.length - 1],
            high: quote.high?.[quote.high.length - 1],
            low: quote.low?.[quote.low.length - 1],
            volume: quote.volume?.[quote.volume.length - 1],
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
            timestamp: result.timestamp?.[result.timestamp.length - 1],
        };
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(
                "Yahoo Finance stock error:",
                error.response?.data || error.message
            );
        } else {
            console.error("Yahoo Finance stock error:", error);
        }

        throw new Error(
            `Failed to get stock data for ${trimmedSymbol}`
        );
    }
};

export const getHistoricalData = async (
    symbol: string,
    period: StockPeriod = "1M"
): Promise<HistoricalStockData[]> => {
    const trimmedSymbol = symbol.trim().toUpperCase();

    if (!trimmedSymbol) {
        throw new Error("Stock symbol is required");
    }

    try {
        const config = getPeriodConfig(period);

        const response = await axios.get(
            `${YAHOO_CHART_URL}/${encodeURIComponent(trimmedSymbol)}`,
            {
                params: {
                    range: config.range,
                    interval: config.interval,
                    events: "div,splits",
                },
                timeout: 15000,
            }
        );

        const result = response.data?.chart?.result?.[0];

        if (!result) {
            throw new Error(
                `Historical data not found: ${trimmedSymbol}`
            );
        }

        const timestamps: number[] = result.timestamp || [];
        const quote = result.indicators?.quote?.[0] || {};

        return timestamps
            .map((timestamp: number, index: number) => ({
                timestamp,
                date: new Date(timestamp * 1000).toISOString(),
                open: quote.open?.[index],
                high: quote.high?.[index],
                low: quote.low?.[index],
                close: quote.close?.[index],
                volume: quote.volume?.[index],
            }))
            .filter(
                (item: HistoricalStockData) => item.close != null
            );
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(
                "Yahoo Finance historical data error:",
                error.response?.data || error.message
            );
        } else {
            console.error(
                "Yahoo Finance historical data error:",
                error
            );
        }

        throw new Error(
            `Failed to get historical data for ${trimmedSymbol}`
        );
    }
};
const FUNDAMENTALS_CACHE_TTL = 12 * 60 * 60 * 1000;

const fundamentalsCache = new Map<
    string,
    {
        data: StockFundamentals;
        expiresAt: number;
    }
>();

const pendingFundamentalsRequests = new Map<
    string,
    Promise<StockFundamentals>
>();

export const getFundamentals = async (
    symbol: string
): Promise<StockFundamentals> => {
    const trimmedSymbol = symbol
        .trim()
        .toUpperCase()
        .replace(/\.(NS|BO)$/, "");

    if (!trimmedSymbol) {
        throw new Error("Stock symbol is required");
    }

    if (!BHARATSTOCK_API_KEY) {
        throw new Error("BHARATSTOCK_API_KEY is not configured");
    }

    const cacheKey = trimmedSymbol;

    // 1. Return cached data if it has not expired.
    const cached = fundamentalsCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
        console.log(`[Cache HIT] Fundamentals: ${cacheKey}`);
        return cached.data;
    }

    if (cached) {
        fundamentalsCache.delete(cacheKey);
    }

    // 2. Reuse an API request already in progress.
    const pending = pendingFundamentalsRequests.get(cacheKey);

    if (pending) {
        console.log(`[REQUEST REUSED] Fundamentals: ${cacheKey}`);
        return pending;
    }

    // 3. Otherwise, call BharatStock.
    const request = (async (): Promise<StockFundamentals> => {
        try {
            const response = await axios.get(
                `${BHARATSTOCK_BASE_URL}/v1/stocks/${encodeURIComponent(
                    trimmedSymbol
                )}/ratios`,
                {
                    headers: {
                        "X-API-Key": BHARATSTOCK_API_KEY,
                    },
                    timeout: YAHOO_API_TIMEOUT,
                }
            );

            const data = response.data;

            const fundamentals: StockFundamentals = {
                symbol: trimmedSymbol,
                price: data.price,
                marketCap: data.market_cap,
                sharesOutstanding: data.shares_outstanding,
                trailingPE: data.pe_ratio,
                priceToBook: data.pb_ratio,
                bookValuePerShare: data.book_value_per_share,
                eps: data.eps,
                returnOnEquity: data.roe,
                returnOnCapitalEmployed: data.roce,
                dividendYield: data.dividend_yield,
                faceValue: data.face_value,
                fiftyTwoWeekHigh: data.week_52_high,
                fiftyTwoWeekLow: data.week_52_low,
                asOfDate: data.as_of_date,
                financialsPeriodType: data.financials_period_type,
                financialsFiscalYear: data.financials_fiscal_year,
            };

            // Cache only a valid object response.
            if (
                data &&
                typeof data === "object" &&
                !Array.isArray(data)
            ) {
                fundamentalsCache.set(cacheKey, {
                    data: fundamentals,
                    expiresAt: Date.now() + FUNDAMENTALS_CACHE_TTL,
                });

                console.log(`[Cache SAVED] Fundamentals: ${cacheKey}`);
            }

            return fundamentals;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error(
                    "BharatStock fundamentals error:",
                    error.response?.data || error.message
                );
            } else {
                console.error("BharatStock fundamentals error:", error);
            }

            throw new Error(
                `Failed to get fundamentals for ${trimmedSymbol}`
            );
        }
    })();

    pendingFundamentalsRequests.set(cacheKey, request);

    try {
        return await request;
    } finally {
        pendingFundamentalsRequests.delete(cacheKey);
    }
};


