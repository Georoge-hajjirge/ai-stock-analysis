
import axios from "axios";
import { StockFundamentals, StockPeriod, StockData, HistoricalStockData, StockSearchResult, YahooSession, YahooValue, CountryMarketConfig, MarketQuote, YahooMarketChartResponse } from "../types/stock.js";

const YAHOO_BASE_URL =
    process.env.YAHOO_FINANCE_BASE_URL ||
    "https://query1.finance.yahoo.com";

const YAHOO_COOKIE_URL =
    process.env.YAHOO_FINANCE_COOKIE_URL ||
    "https://fc.yahoo.com";

const USER_AGENT =
    process.env.YAHOO_FINANCE_USER_AGENT ||
    "Mozilla/5.0";

const YAHOO_API_TIMEOUT = Number(
    process.env.YAHOO_API_TIMEOUT || 15000
);

const FUNDAMENTALS_CACHE_TTL = Number(
    process.env.YAHOO_FINANCE_FUNDAMENTALS_CACHE_TTL ||
    3 * 60 * 60 * 1000
);

const SESSION_CACHE_TTL = Number(
    process.env.YAHOO_FINANCE_SESSION_TTL ||
    30 * 60 * 1000
);


type YahooModule = Record<string, unknown>;

type YahooFundamentalsResponse = {
    quoteSummary?: {
        result?: YahooModule[];
        error?: unknown;
    };
};

let yahooSession: YahooSession | null = null;
let pendingSessionRequest: Promise<YahooSession> | null = null;

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

const getRawValue = (
    module: YahooModule | undefined,
    field: string
): number | undefined => {
    if (!module) return undefined;

    const value = module[field] as YahooValue | undefined;

    return typeof value?.raw === "number"
        ? value.raw
        : undefined;
};

const getYahooSession = async (): Promise<YahooSession> => {
    if (yahooSession && yahooSession.expiresAt > Date.now()) {
        return yahooSession;
    }

    if (pendingSessionRequest) {
        return pendingSessionRequest;
    }

    const request = (async (): Promise<YahooSession> => {
        // Get Yahoo session cookie
        const cookieResponse = await axios.get(YAHOO_COOKIE_URL, {
            headers: {
                "User-Agent": USER_AGENT,
            },
            timeout: YAHOO_API_TIMEOUT,
            validateStatus: () => true,
        });

        const cookies = cookieResponse.headers["set-cookie"];

        if (!cookies?.length) {
            throw new Error("Yahoo session cookie not received");
        }

        const cookieHeader = cookies
            .map((cookie) => cookie.split(";")[0])
            .join("; ");

        // Get Yahoo crumb
        const crumbResponse = await axios.get(
            `${YAHOO_BASE_URL}/v1/test/getcrumb`,
            {
                headers: {
                    "User-Agent": USER_AGENT,
                    Cookie: cookieHeader,
                },
                timeout: YAHOO_API_TIMEOUT,
            }
        );

        const crumb = String(crumbResponse.data).trim();

        if (!crumb || crumb.includes("<")) {
            throw new Error("Invalid Yahoo crumb received");
        }

        const session: YahooSession = {
            cookieHeader,
            crumb,
            expiresAt: Date.now() + SESSION_CACHE_TTL,
        };

        yahooSession = session;

        console.log("[Yahoo] Session created successfully");

        return session;
    })();

    pendingSessionRequest = request;

    try {
        return await request;
    } finally {
        pendingSessionRequest = null;
    }
};

const fetchYahooFundamentals = async (
    symbol: string
): Promise<StockFundamentals> => {
    const session = await getYahooSession();

    const response = await axios.get<YahooFundamentalsResponse>(
        `${YAHOO_BASE_URL}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}`,
        {
            params: {
                modules:
                    "price,summaryDetail,defaultKeyStatistics,financialData",
                crumb: session.crumb,
            },
            headers: {
                "User-Agent": USER_AGENT,
                Cookie: session.cookieHeader,
            },
            timeout: YAHOO_API_TIMEOUT,
        }
    );

    const result = response.data?.quoteSummary?.result?.[0];

    if (!result) {
        throw new Error(
            `Yahoo fundamentals not available for ${symbol}`
        );
    }

    const price = result.price as YahooModule | undefined;
    const summaryDetail = result.summaryDetail as YahooModule | undefined;
    const statistics = result.defaultKeyStatistics as YahooModule | undefined;
    const financialData = result.financialData as YahooModule | undefined;

    const marketTime = getRawValue(price, "regularMarketTime");

    return {
        symbol,
        price: getRawValue(price, "regularMarketPrice"),
        marketCap: getRawValue(summaryDetail, "marketCap"),
        sharesOutstanding: getRawValue(
            statistics,
            "sharesOutstanding"
        ),
        trailingPE: getRawValue(summaryDetail, "trailingPE"),
        priceToBook: getRawValue(statistics, "priceToBook"),
        bookValuePerShare: getRawValue(statistics, "bookValue"),
        eps: getRawValue(statistics, "trailingEps"),
        returnOnEquity: getRawValue(
            financialData,
            "returnOnEquity"
        ),
        dividendYield: getRawValue(summaryDetail, "dividendYield"),
        fiftyTwoWeekHigh: getRawValue(
            summaryDetail,
            "fiftyTwoWeekHigh"
        ),
        fiftyTwoWeekLow: getRawValue(
            summaryDetail,
            "fiftyTwoWeekLow"
        ),
        asOfDate: marketTime
            ? new Date(marketTime * 1000).toISOString()
            : undefined,
    };
};

export const getInternationalFundamentals = async (
    symbol: string
): Promise<StockFundamentals> => {
    const trimmedSymbol = symbol.trim().toUpperCase();

    if (!trimmedSymbol) {
        throw new Error("International stock symbol is required");
    }

    const cacheKey = trimmedSymbol;

    // Check cache
    const cached = fundamentalsCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
        console.log(`[Cache HIT] International fundamentals: ${cacheKey}`);
        return cached.data;
    }

    if (cached) {
        fundamentalsCache.delete(cacheKey);
    }

    // Reuse an existing request
    const pending = pendingFundamentalsRequests.get(cacheKey);

    if (pending) {
        return pending;
    }

    const request = (async (): Promise<StockFundamentals> => {
        try {
            const fundamentals = await fetchYahooFundamentals(cacheKey);

            fundamentalsCache.set(cacheKey, {
                data: fundamentals,
                expiresAt: Date.now() + FUNDAMENTALS_CACHE_TTL,
            });

            console.log(
                `[Cache SAVED] International fundamentals: ${cacheKey}`
            );

            return fundamentals;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error(
                    `[Yahoo Fundamentals] ${cacheKey}:`,
                    error.response?.status,
                    error.response?.data || error.message
                );

                // Allow a fresh session on the next request.
                if (error.response?.status === 401) {
                    yahooSession = null;
                }
            } else {
                console.error(
                    `[Yahoo Fundamentals] ${cacheKey}:`,
                    error
                );
            }

            throw new Error(
                `Failed to get international fundamentals for ${cacheKey}`
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
        case "5Y":
            return { range: "5y", interval: "1wk" };
        case "ALL":
            return { range: "max", interval: "1mo" };
        default:
            return { range: "1mo", interval: "1d" };
    }
};

export const getInternationalStockData = async (
    symbol: string
): Promise<StockData> => {
    const trimmedSymbol = symbol.trim().toUpperCase();

    if (!trimmedSymbol) {
        throw new Error("International stock symbol is required");
    }

    try {
        const response = await axios.get(
            `${YAHOO_BASE_URL}/v8/finance/chart/${encodeURIComponent(trimmedSymbol)}`,
            {
                params: {
                    range: "1d",
                    interval: "1d",
                    events: "div,splits",
                },
                headers: {
                    "User-Agent": USER_AGENT,
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
            meta.regularMarketPrice ??
            (prices.length > 0 ? prices[prices.length - 1] : undefined);
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
            timestamp:
                result.timestamp?.[result.timestamp.length - 1],
        };
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(
                `[Yahoo International Stock] ${trimmedSymbol}:`,
                error.response?.data || error.message
            );
        } else {
            console.error(
                `[Yahoo International Stock] ${trimmedSymbol}:`,
                error
            );
        }

        throw new Error(
            `Failed to get international stock data for ${trimmedSymbol}`
        );
    }
};

export const getInternationalHistoricalData = async (
    symbol: string,
    period: StockPeriod = "1M"
): Promise<HistoricalStockData[]> => {
    const trimmedSymbol = symbol.trim().toUpperCase();

    if (!trimmedSymbol) {
        throw new Error("International stock symbol is required");
    }

    try {
        const config = getPeriodConfig(period);

        const response = await axios.get(
            `${YAHOO_BASE_URL}/v8/finance/chart/${encodeURIComponent(trimmedSymbol)}`,
            {
                params: {
                    range: config.range,
                    interval: config.interval,
                    events: "div,splits",
                },
                headers: {
                    "User-Agent": USER_AGENT,
                },
                timeout: YAHOO_API_TIMEOUT,
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
                `[Yahoo International History] ${trimmedSymbol}:`,
                error.response?.data || error.message
            );
        } else {
            console.error(
                `[Yahoo International History] ${trimmedSymbol}:`,
                error
            );
        }

        throw new Error(
            `Failed to get international historical data for ${trimmedSymbol}`
        );
    }
};


const COUNTRY_EXCHANGES: Record<string, string[]> = {
    usa: ["NMS", "NYQ", "NGM", "NCM", "PCX", "ASE"],
    japan: ["JPX", "TYO"],
    china: ["SHH", "SHZ", "SHG", "SHE"],
    "south-korea": ["KSC", "KOE"],
    uk: ["LSE"],
    germany: ["GER", "FRA", "HAM", "MUN", "STU", "DUS"],
};


const COUNTRY_MARKET_CONFIG: Record<string, CountryMarketConfig> = {
    usa: {
        name: "United States",
        indices: [
            { symbol: "^GSPC", name: "S&P 500" },
            { symbol: "^IXIC", name: "NASDAQ Composite" },
            { symbol: "^DJI", name: "Dow Jones" },
            { symbol: "^NDX", name: "NASDAQ 100" },
            { symbol: "^RUT", name: "Russell 2000" },
        ],
        featuredStocks: ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META"],
    },
    japan: {
        name: "Japan",
        indices: [
            { symbol: "^N225", name: "Nikkei 225" },
            { symbol: "^TOPX", name: "TOPIX" },
        ],
        featuredStocks: ["7203.T", "6758.T", "8306.T", "9984.T", "8035.T"],
    },
    china: {
        name: "China",
        indices: [
            { symbol: "000001.SS", name: "Shanghai Composite" },
            { symbol: "399001.SZ", name: "Shenzhen Component" },
        ],
        featuredStocks: ["600519.SS", "601398.SS", "600036.SS", "000858.SZ", "300750.SZ"],
    },
    "south-korea": {
        name: "South Korea",
        indices: [
            { symbol: "^KS11", name: "KOSPI" },
            { symbol: "^KQ11", name: "KOSDAQ" },
        ],
        featuredStocks: ["005930.KS", "000660.KS", "005380.KS", "035420.KS"],
    },
    uk: {
        name: "United Kingdom",
        indices: [
            { symbol: "^FTSE", name: "FTSE 100" },
            { symbol: "^FTMC", name: "FTSE 250" },
            { symbol: "^FTLC", name: "FTSE 350" },
            { symbol: "^FTAS", name: "FTSE All-Share" },
        ],
        featuredStocks: ["SHEL.L", "AZN.L", "HSBA.L", "ULVR.L", "BP.L"],
    },
    germany: {
        name: "Germany",
        indices: [
            { symbol: "^GDAXI", name: "DAX" },
        ],
        featuredStocks: ["SAP.DE", "SIE.DE", "ALV.DE", "DTE.DE", "MBG.DE"],
    },
};

const fetchInternationalMarketQuote = async (
    symbol: string
): Promise<MarketQuote> => {
    const response = await axios.get<YahooMarketChartResponse>(
        `${YAHOO_BASE_URL}/v8/finance/chart/${encodeURIComponent(symbol)}`,
        {
            params: {
                range: "1d",
                interval: "5m",
            },
            headers: {
                "User-Agent": USER_AGENT,
            },
            timeout: YAHOO_API_TIMEOUT,
        }
    );

    const result = response.data?.chart?.result?.[0];

    if (!result?.meta) {
        throw new Error(`Market data unavailable for ${symbol}`);
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    const price =
        typeof meta.regularMarketPrice === "number"
            ? meta.regularMarketPrice
            : quote?.close?.filter(
                (value): value is number => value != null
            ).at(-1);

    const previousClose =
        typeof meta.chartPreviousClose === "number"
            ? meta.chartPreviousClose
            : typeof meta.previousClose === "number"
                ? meta.previousClose
                : undefined;

    const change =
        price !== undefined && previousClose !== undefined
            ? price - previousClose
            : undefined;

    const changePercent =
        change !== undefined && previousClose
            ? (change / previousClose) * 100
            : undefined;

    return {
        symbol,
        name:
            typeof meta.longName === "string"
                ? meta.longName
                : typeof meta.shortName === "string"
                    ? meta.shortName
                    : symbol,
        exchange:
            typeof meta.exchangeName === "string"
                ? meta.exchangeName
                : undefined,
        currency:
            typeof meta.currency === "string"
                ? meta.currency
                : undefined,
        price,
        previousClose,
        change,
        changePercent,
        timestamp:
            typeof meta.regularMarketTime === "number"
                ? meta.regularMarketTime
                : result.timestamp?.at(-1),
        marketState:
            typeof meta.marketState === "string"
                ? meta.marketState
                : undefined,
    };
};

export const getInternationalMarketOverview = async (
    country: string
) => {
    const normalizedCountry = country.trim().toLowerCase();
    const config = COUNTRY_MARKET_CONFIG[normalizedCountry];

    if (!config) {
        throw new Error("Unsupported international market");
    }

    const [indexResults, stockResults] = await Promise.all([
        Promise.allSettled(
            config.indices.map(async (index) => ({
                ...await fetchInternationalMarketQuote(index.symbol),
                name: index.name,
            }))
        ),
        Promise.allSettled(
            config.featuredStocks.map((symbol) =>
                fetchInternationalMarketQuote(symbol)
            )
        ),
    ]);

    const indices = indexResults
        .filter(
            (result): result is PromiseFulfilledResult<MarketQuote> =>
                result.status === "fulfilled"
        )
        .map((result) => result.value);

    const featuredStocks = stockResults
        .filter(
            (result): result is PromiseFulfilledResult<MarketQuote> =>
                result.status === "fulfilled"
        )
        .map((result) => result.value);

    const timestamps = [...indices, ...featuredStocks]
        .map((item) => item.timestamp)
        .filter((value): value is number => value !== undefined);

    return {
        country: normalizedCountry,
        countryName: config.name,
        indices,
        featuredStocks,
        updatedAt: timestamps.length
            ? new Date(Math.max(...timestamps) * 1000).toISOString()
            : null,
    };
};

export const searchInternationalStocks = async (
    query: string,
    country: string
): Promise<StockSearchResult[]> => {
    const trimmedQuery = query.trim();
    const normalizedCountry = country.trim().toLowerCase();

    if (!trimmedQuery) return [];

    const allowedExchanges = COUNTRY_EXCHANGES[normalizedCountry];

    if (!allowedExchanges) {
        throw new Error("Unsupported international market");
    }

    try {
        const response = await axios.get(
            `${YAHOO_BASE_URL}/v1/finance/search`,
            {
                params: {
                    q: trimmedQuery,
                    quotesCount: 20,
                    newsCount: 0,
                    listsCount: 0,
                },
                headers: {
                    "User-Agent": USER_AGENT,
                },
                timeout: YAHOO_API_TIMEOUT,
            }
        );

        const quotes = response.data?.quotes;

        if (!Array.isArray(quotes)) return [];

        return quotes
            .filter((item: Record<string, unknown>) => {
                const isStock = item.quoteType === "EQUITY";
                const exchange =
                    typeof item.exchange === "string"
                        ? item.exchange
                        : "";

                return isStock && allowedExchanges.includes(exchange);
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
                            : String(item.symbol ?? ""),
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
                type: "EQUITY",
            }));
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(
                "[International Stock Search]",
                error.response?.data || error.message
            );
        } else {
            console.error("[International Stock Search]", error);
        }

        throw new Error("Failed to search international stocks");
    }
};
