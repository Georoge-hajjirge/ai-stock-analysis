
import { useState } from "react";
import {
    ArrowRightLeft,
    Check,
    LoaderCircle,
    Search,
    Sparkles,
    TrendingDown,
    TrendingUp,
    X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    compareStocks,
    searchStocks,
    type StockComparisonItem,
    type StockComparisonResponse,
} from "../services/stockService";

import type { StockSearchResult } from "../types/stock";
import Header from "../components/Header";

const formatCurrency = (value?: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "—";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
};

const formatNumber = (value?: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "—";
    }

    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(value);
};

const formatPercent = (value?: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "—";
    }

    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

function StockComparison() {

    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
    const [selectedStocks, setSelectedStocks] = useState<StockSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [comparing, setComparing] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<StockComparisonResponse | null>(null);

    const handleSearch = async () => {
        if (!query.trim() || searching) return;

        try {
            setSearching(true);
            setError("");

            const stocks = await searchStocks(query.trim());
            const selectedSymbols = new Set(
                selectedStocks.map((stock) => stock.symbol)
            );

            setSearchResults(
                stocks.filter((stock) => !selectedSymbols.has(stock.symbol))
            );
        } catch (err) {
            console.error(err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to search stocks."
            );
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleAddStock = (stock: StockSearchResult) => {
        if (selectedStocks.length >= 3) {
            setError("You can compare up to three stocks at a time.");
            return;
        }

        if (selectedStocks.some((item) => item.symbol === stock.symbol)) {
            return;
        }

        setSelectedStocks((previous) => [...previous, stock]);
        setSearchResults([]);
        setQuery("");
        setError("");
        setResult(null);
    };

    const handleRemoveStock = (symbol: string) => {
        setSelectedStocks((previous) =>
            previous.filter((stock) => stock.symbol !== symbol)
        );
        setResult(null);
        setError("");
    };

    const handleCompare = async () => {
        if (selectedStocks.length < 2) {
            setError("Select at least two different stocks to compare.");
            return;
        }

        try {
            setComparing(true);
            setError("");
            setResult(null);

            const response = await compareStocks(
                selectedStocks.map((stock) => stock.symbol)
            );

            setResult(response);
        } catch (err) {
            console.error(err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to compare stocks. Please try again."
            );
        } finally {
            setComparing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Header showBack />
            <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
                <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-9 text-white sm:px-9 sm:py-12">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                            <Sparkles size={14} />
                            AI-powered comparison
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Compare stocks intelligently
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                            Compare Indian stocks using market prices,
                            financial fundamentals, historical performance,
                            company news and Gemini AI analysis.
                        </p>
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h2 className="text-base font-bold">
                                Select stocks
                            </h2>
                            <span className="text-xs font-medium text-slate-500">
                                {selectedStocks.length}/3 selected
                            </span>
                        </div>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void handleSearch();
                            }}
                            className="flex flex-col gap-3 sm:flex-row"
                        >
                            <div className="relative flex-1">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setSearchResults([]);
                                    }}
                                    placeholder="Search company name or symbol, e.g. Infosys"
                                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={searching || !query.trim() || selectedStocks.length >= 3}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {searching ? (
                                    <LoaderCircle size={16} className="animate-spin" />
                                ) : (
                                    <Search size={16} />
                                )}
                                {searching ? "Searching..." : "Search stocks"}
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                {searchResults.slice(0, 8).map((stock) => (
                                    <button
                                        key={stock.symbol}
                                        onClick={() => handleAddStock(stock)}
                                        type="button"
                                        className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-blue-50"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-slate-900">
                                                {stock.name}
                                            </span>
                                            <span className="mt-1 block text-xs text-slate-500">
                                                {stock.symbol} · {stock.exchangeDisplayName || stock.exchange}
                                            </span>
                                        </span>
                                        <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                            Add
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedStocks.length > 0 && (
                            <div className="mt-5 flex flex-wrap gap-2">
                                {selectedStocks.map((stock) => (
                                    <div
                                        key={stock.symbol}
                                        className="inline-flex max-w-full items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2"
                                    >
                                        <span className="truncate text-sm font-semibold text-blue-900">
                                            {stock.symbol}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStock(stock.symbol)}
                                            aria-label={`Remove ${stock.symbol}`}
                                            className="rounded-md p-1 text-blue-700 hover:bg-blue-100"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={() => void handleCompare()}
                                disabled={comparing || selectedStocks.length < 2}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {comparing ? (
                                    <LoaderCircle size={17} className="animate-spin" />
                                ) : (
                                    <ArrowRightLeft size={17} />
                                )}
                                {comparing ? "Comparing stocks..." : "Compare selected stocks"}
                            </button>

                            <p className="text-xs leading-5 text-slate-500">
                                Select two or three stocks to generate a comparison.
                            </p>
                        </div>
                    </div>
                </section>

                {comparing && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
                        <LoaderCircle size={20} className="animate-spin" />
                        Fetching stock data and generating AI analysis. This may take a little while.
                    </div>
                )}

                {result && (
                    <ComparisonResults
                        result={result}
                        onRemoveUnavailable={(symbol) => {
                            handleRemoveStock(symbol);
                        }}
                    />
                )}

                <p className="mt-8 text-center text-xs leading-5 text-slate-400">
                    Market data may be delayed or vary by provider. AI-generated
                    information is for educational purposes only and is not financial advice.
                </p>
            </main>
        </div>
    );
}

function ComparisonResults({
    result,
    onRemoveUnavailable,
}: {
    result: StockComparisonResponse;
    onRemoveUnavailable: (symbol: string) => void;
}) {
    const stocks = result.data;

    const metrics: {
        label: string;
        getValue: (item: StockComparisonItem) => string;
    }[] = [
            {
                label: "Current price",
                getValue: (item) => formatCurrency(item.stock.price),
            },
            {
                label: "Daily change",
                getValue: (item) => formatPercent(item.stock.changePercent),
            },
            {
                label: "52-week high",
                getValue: (item) => formatCurrency(item.stock.fiftyTwoWeekHigh),
            },
            {
                label: "52-week low",
                getValue: (item) => formatCurrency(item.stock.fiftyTwoWeekLow),
            },
            {
                label: "Trailing P/E",
                getValue: (item) => formatNumber(item.fundamentals?.trailingPE),
            },
            {
                label: "Price to book",
                getValue: (item) => formatNumber(item.fundamentals?.priceToBook),
            },
            {
                label: "Return on equity",
                getValue: (item) =>
                    item.fundamentals?.returnOnEquity == null
                        ? "—"
                        : `${formatNumber(item.fundamentals.returnOnEquity)}%`,
            },
            {
                label: "Return on capital employed",
                getValue: (item) =>
                    item.fundamentals?.returnOnCapitalEmployed == null
                        ? "—"
                        : `${formatNumber(item.fundamentals.returnOnCapitalEmployed)}%`,
            },
            {
                label: "Dividend yield",
                getValue: (item) =>
                    item.fundamentals?.dividendYield == null
                        ? "—"
                        : `${formatNumber(item.fundamentals.dividendYield)}%`,
            },
            {
                label: "One-year performance",
                getValue: (item) =>
                    formatPercent(item.historicalPerformance.changePercent),
            },
        ];

    return (
        <div className="space-y-6">
            {result.unavailableSymbols.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">
                        Some stocks could not be retrieved
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {result.unavailableSymbols.map((symbol) => (
                            <span
                                key={symbol}
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2"
                            >
                                {symbol}
                                <button
                                    type="button"
                                    onClick={() => onRemoveUnavailable(symbol)}
                                    className="text-amber-800 underline"
                                >
                                    Remove
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <section>
                <div className="mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-slate-950">
                        Market overview
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Current quotes and recent price movement
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {stocks.map((item) => {
                        const dailyChange = item.stock.changePercent ?? 0;
                        const positive = dailyChange >= 0;

                        return (
                            <article
                                key={item.symbol}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-500">
                                            {item.stock.name || item.symbol}
                                        </p>
                                        <h3 className="mt-1 text-lg font-bold text-slate-950">
                                            {item.symbol}
                                        </h3>
                                    </div>
                                    <span
                                        className={`rounded-lg p-2 ${positive
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-red-50 text-red-600"
                                            }`}
                                    >
                                        {positive ? (
                                            <TrendingUp size={19} />
                                        ) : (
                                            <TrendingDown size={19} />
                                        )}
                                    </span>
                                </div>

                                <p className="mt-6 text-3xl font-bold tracking-tight text-slate-950">
                                    {formatCurrency(item.stock.price)}
                                </p>

                                <p
                                    className={`mt-2 text-sm font-semibold ${positive ? "text-emerald-600" : "text-red-600"
                                        }`}
                                >
                                    {formatCurrency(item.stock.change)} (
                                    {formatPercent(item.stock.changePercent)})
                                    <span className="ml-1 font-normal text-slate-400">
                                        today
                                    </span>
                                </p>

                                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Day high
                                        </p>
                                        <p className="mt-1 text-sm font-semibold">
                                            {formatCurrency(item.stock.high)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Day low
                                        </p>
                                        <p className="mt-1 text-sm font-semibold">
                                            {formatCurrency(item.stock.low)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                                    <Check size={14} className="text-emerald-600" />
                                    Market data retrieved
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <h2 className="text-xl font-bold tracking-tight">
                        Fundamentals and performance
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Compare valuation, returns and one-year price changes.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 font-semibold text-slate-500">
                                    Metric
                                </th>
                                {stocks.map((item) => (
                                    <th
                                        key={item.symbol}
                                        className="px-5 py-4 font-bold text-slate-900"
                                    >
                                        {item.symbol}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.map((metric) => (
                                <tr
                                    key={metric.label}
                                    className="border-t border-slate-100"
                                >
                                    <td className="px-5 py-4 text-slate-600">
                                        {metric.label}
                                    </td>
                                    {stocks.map((item) => {
                                        const value = metric.getValue(item);
                                        const isNegative =
                                            metric.label.includes("performance") &&
                                            value.startsWith("-");

                                        return (
                                            <td
                                                key={item.symbol}
                                                className={`px-5 py-4 font-semibold ${isNegative
                                                    ? "text-red-600"
                                                    : "text-slate-900"
                                                    }`}
                                            >
                                                {value}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-5 text-slate-500 sm:px-6">
                    Missing fundamentals are displayed as a dash. Historical performance
                    uses the first and last available closing prices in the returned period.
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight">
                        Company news
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Recent articles returned by your news service
                    </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    {stocks.map((item) => (
                        <div key={item.symbol} className="min-w-0">
                            <h3 className="mb-3 text-sm font-bold text-slate-900">
                                {item.symbol}
                            </h3>

                            {item.news.length === 0 ? (
                                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                    No news articles available.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {item.news.map((article, index) => (
                                        <article
                                            key={`${item.symbol}-${article.url}-${index}`}
                                            className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200"
                                        >
                                            <a
                                                href={article.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm font-semibold leading-6 text-slate-900 hover:text-blue-700"
                                            >
                                                {article.title}
                                            </a>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                                {article.description}
                                            </p>
                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                                                <span>{article.source}</span>
                                                <span>
                                                    {article.publishedAt
                                                        ? new Date(
                                                            article.publishedAt
                                                        ).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })
                                                        : ""}
                                                </span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
                <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-blue-50 px-5 py-5 sm:px-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-950">
                                Gemini AI comparison
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                AI-generated analysis based on the returned data
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 p-5 text-sm leading-7 text-slate-700 sm:p-7 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_strong]:font-bold [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2 [&_td]:border [&_td]:border-slate-200 [&_td]:p-2">

                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            a: ({ href, children }) => (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-blue-700 underline"
                                >
                                    {children}
                                </a>
                            ),
                        }}
                    >
                        {result.aiAnalysis || "No AI analysis was returned."}
                    </ReactMarkdown>

                </div>
            </section>
        </div>
    );
}

export default StockComparison;
