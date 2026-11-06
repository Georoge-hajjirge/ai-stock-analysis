
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Search,
    Globe,
    TrendingUp,
    ArrowRight,
    X,
    RefreshCw,
    Activity,
    BarChart3,
    Building2,
    ArrowLeft,
} from "lucide-react";

import Header from "../components/Header";
import SearchResults from "../components/SearchResults";

import {
    searchInternationalStocks,
    getInternationalMarketOverview,
    type InternationalMarketOverview,
    type InternationalMarketQuote,
} from "../services/internationalStockService";

import type { StockSearchResult } from "../types/stock";

const markets: Record<
    string,
    {
        name: string;
        flag: string;
        exchange: string;
        currency: string;
    }
> = {
    usa: {
        name: "United States",
        flag: "🇺🇸",
        exchange: "NYSE · NASDAQ",
        currency: "USD",
    },
    japan: {
        name: "Japan",
        flag: "🇯🇵",
        exchange: "Tokyo Stock Exchange",
        currency: "JPY",
    },
    china: {
        name: "China",
        flag: "🇨🇳",
        exchange: "Shanghai · Shenzhen",
        currency: "CNY",
    },
    "south-korea": {
        name: "South Korea",
        flag: "🇰🇷",
        exchange: "Korea Exchange",
        currency: "KRW",
    },
    uk: {
        name: "United Kingdom",
        flag: "🇬🇧",
        exchange: "London Stock Exchange",
        currency: "GBP",
    },
    germany: {
        name: "Germany",
        flag: "🇩🇪",
        exchange: "XETRA · Frankfurt",
        currency: "EUR",
    },
};

function formatPrice(
    value: number | undefined,
    currency: string
) {
    if (value === undefined || !Number.isFinite(value)) {
        return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}

function formatNumber(value: number | undefined) {
    if (value === undefined || !Number.isFinite(value)) {
        return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
    }).format(value);
}

function formatChange(value: number | undefined) {
    if (value === undefined || !Number.isFinite(value)) {
        return "N/A";
    }

    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatUpdatedAt(value: string | null) {
    if (!value) return "Unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Unavailable";

    return date.toLocaleString();
}

function ChangeIndicator({
    value,
}: {
    value?: number;
}) {
    if (value === undefined || !Number.isFinite(value)) {
        return (
            <span className="text-sm text-slate-400">
                N/A
            </span>
        );
    }

    const positive = value >= 0;

    return (
        <span
            className={`inline-flex items-center gap-1 text-sm font-semibold ${positive
                ? "text-emerald-600"
                : "text-red-600"
                }`}
        >
            <TrendingUp
                size={14}
                className={!positive ? "rotate-180" : ""}
            />
            {formatChange(value)}
        </span>
    );
}

function IndexCard({
    index,
}: {
    index: InternationalMarketQuote;
}) {
    const positive = (index.changePercent ?? 0) >= 0;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-700">
                        {index.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        {index.symbol}
                    </p>
                </div>

                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${positive
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600"
                        }`}
                >
                    <Activity size={18} />
                </div>
            </div>

            <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
                {formatNumber(index.price)}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <ChangeIndicator value={index.changePercent} />

                {index.change !== undefined && (
                    <span className="text-xs text-slate-400">
                        ({index.change > 0 ? "+" : ""}
                        {formatNumber(index.change)})
                    </span>
                )}
            </div>
        </div>
    );
}

function GlobalMarketPage() {
    const { country } = useParams<{ country: string }>();
    const navigate = useNavigate();

    const market = country ? markets[country] : undefined;

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<StockSearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");

    const [marketData, setMarketData] =
        useState<InternationalMarketOverview | null>(null);

    const [marketLoading, setMarketLoading] = useState(true);
    const [marketError, setMarketError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const loadMarket = useCallback(async (isRefresh = false) => {
        if (!country || !markets[country]) return;

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setMarketLoading(true);
            }

            setMarketError("");

            const data = await getInternationalMarketOverview(country);

            setMarketData(data);
        } catch (error) {
            console.error("Failed to load market overview:", error);

            setMarketError(
                "Unable to load market overview. Please try again."
            );
        } finally {
            setMarketLoading(false);
            setRefreshing(false);
        }
    }, [country]);

    useEffect(() => {
        setMarketData(null);
        setResults([]);
        setQuery("");
        setSearchError("");

        if (country && markets[country]) {
            void loadMarket();
        }
    }, [country, loadMarket]);

    if (!country || !market) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Globe size={36} className="mx-auto mb-4 text-slate-400" />

                    <h2 className="text-xl font-bold text-slate-900">
                        Market not found
                    </h2>

                    <button
                        onClick={() => navigate("/")}
                        className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const handleSearch = async () => {
        const searchQuery = query.trim();

        if (!searchQuery || searchLoading) return;

        try {
            setSearchLoading(true);
            setSearchError("");
            setResults([]);

            const data = await searchInternationalStocks(
                searchQuery,
                country
            );

            setResults(data);

            if (data.length === 0) {
                setSearchError(
                    "No matching stocks found. Try another company name or symbol."
                );
            }
        } catch (error) {
            console.error(error);

            setSearchError(
                "Unable to search stocks. Please try again."
            );
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelect = (stock: StockSearchResult) => {
        navigate(`/stock/${encodeURIComponent(stock.symbol)}`);
    };

    const handleFeaturedStockSelect = (
        stock: InternationalMarketQuote
    ) => {
        navigate(`/stock/${encodeURIComponent(stock.symbol)}`);
    };

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setSearchError("");
    };

    const currency = marketData?.featuredStocks[0]?.currency
        || market.currency;


    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
                <div className="mb-5">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <ArrowLeft size={16} />
                        Back to Global Markets
                    </button>
                </div>
                {/* Country Header */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-4xl">
                                {market.flag}
                            </div>

                            <div>
                                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-blue-600">
                                    <Globe size={15} />
                                    Global Markets
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                    {market.name} Market Overview
                                </h1>

                                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                                    Explore major market indices, leading companies,
                                    stock prices and daily market movements across {market.name}.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => void loadMarket(true)}
                            disabled={refreshing || marketLoading}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={refreshing ? "animate-spin" : ""}
                            />
                            Refresh Market
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:grid-cols-3 sm:px-8">
                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Major Exchanges
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {market.exchange}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Trading Currency
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {market.currency}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Market Data Last Updated
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {formatUpdatedAt(marketData?.updatedAt ?? null)}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stock Search */}
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">


                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Find Stocks in {market.name}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Search companies by name or stock symbol.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
                        <Search
                            size={19}
                            className="ml-3 shrink-0 text-slate-400"
                        />

                        <input
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setSearchError("");
                                setResults([]);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    void handleSearch();
                                }
                            }}
                            placeholder={`Search ${market.name} companies or symbols...`}
                            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />

                        {query && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                aria-label="Clear search"
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                            >
                                <X size={17} />
                            </button>
                        )}

                        <button
                            onClick={() => void handleSearch()}
                            disabled={searchLoading || !query.trim()}
                            className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {searchLoading ? "Searching..." : "Search"}
                            {!searchLoading && <ArrowRight size={15} />}
                        </button>
                    </div>

                    {searchLoading && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                            <RefreshCw size={15} className="animate-spin" />
                            Searching companies...
                        </div>
                    )}

                    {searchError && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                            {searchError}
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="mt-6 border-t border-slate-100 pt-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-900">
                                        Search Results
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {results.length} matching companies found
                                    </p>
                                </div>

                                <button
                                    onClick={clearSearch}
                                    className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
                                >
                                    Clear results
                                </button>
                            </div>

                            <SearchResults
                                results={results}
                                onSelect={handleSelect}
                            />
                        </div>
                    )}
                </section>

                {/* Market Indices */}
                <section className="mt-10">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Activity size={20} />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-slate-950">
                                    Market Indices
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Track the overall performance of major market benchmarks.
                                </p>
                            </div>
                        </div>

                        <span className="text-xs text-slate-400">
                            Values shown in index points
                        </span>
                    </div>

                    {marketLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-44 animate-pulse rounded-2xl bg-slate-200"
                                />
                            ))}
                        </div>
                    ) : marketError ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                            {marketError}
                            <button
                                onClick={() => void loadMarket()}
                                className="ml-3 font-semibold underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : marketData?.indices.length ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {marketData.indices.map((index) => (
                                <IndexCard
                                    key={index.symbol}
                                    index={index}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                            Market index data is currently unavailable.
                        </div>
                    )}
                </section>

                {/* Featured Companies */}
                <section className="mt-10">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <Building2 size={20} />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-slate-950">
                                    Featured Companies
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Selected companies and their daily stock performance.
                                </p>
                            </div>
                        </div>

                        <span className="text-xs text-slate-400">
                            {marketData?.featuredStocks.length ?? 0} companies
                        </span>
                    </div>

                    {marketLoading ? (
                        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
                    ) : marketData?.featuredStocks.length ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-6 py-5">
                                <h3 className="font-bold text-slate-900">
                                    Leading Market Companies
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Current share prices and daily market movements.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[750px] text-left">
                                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-6 py-4">Company</th>
                                            <th className="px-6 py-4">Symbol</th>
                                            <th className="px-6 py-4">Current Price</th>
                                            <th className="px-6 py-4">Daily Change</th>
                                            <th className="px-6 py-4">Exchange</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {marketData.featuredStocks.map((stock) => (
                                            <tr
                                                key={stock.symbol}
                                                className="transition-colors hover:bg-blue-50/40"
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-900">
                                                        {stock.name}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                                        {stock.symbol}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-900">
                                                        {formatPrice(
                                                            stock.price,
                                                            stock.currency || currency
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Previous close: {formatPrice(
                                                            stock.previousClose,
                                                            stock.currency || currency
                                                        )}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <ChangeIndicator
                                                        value={stock.changePercent}
                                                    />
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {stock.change !== undefined
                                                            ? `${stock.change > 0 ? "+" : ""}${formatNumber(stock.change)} ${stock.currency || currency}`
                                                            : "Change unavailable"}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {stock.exchange || "N/A"}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFeaturedStockSelect(stock)}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                                                    >
                                                        View Details
                                                        <ArrowRight size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3">
                                <p className="text-xs leading-5 text-slate-500">
                                    Daily change compares the current share price with
                                    the previous closing price. Select View Details
                                    to explore an individual company's information.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                            Featured company data is currently unavailable.
                        </div>
                    )}
                </section>

                {/* Data Disclaimer */}
                <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
                    <BarChart3
                        size={17}
                        className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <p className="text-xs leading-5 text-slate-500">
                        Market figures are provided by Yahoo Finance and may be delayed.
                        Index values are displayed in index points, while company prices
                        are displayed in their respective trading currencies.
                        This information is for educational purposes and is not financial advice.
                    </p>
                </div>
            </main>
        </div>
    );

}

export default GlobalMarketPage;
