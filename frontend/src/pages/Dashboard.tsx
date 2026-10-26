import { useState } from "react";
import {
    ArrowRight,
    ChartNoAxesCombined,
    Search,
    Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import SearchResults from "../components/SearchResults";
import { searchStocks } from "../services/stockService";
import type { StockSearchResult } from "../types/stock";

const popularStocks = [
    {
        symbol: "TCS.NS",
        name: "Tata Consultancy Services",
    },
    {
        symbol: "INFY.NS",
        name: "Infosys",
    },
    {
        symbol: "RELIANCE.NS",
        name: "Reliance Industries",
    },
    {
        symbol: "HDFCBANK.NS",
        name: "HDFC Bank",
    },
];

function Dashboard() {
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<StockSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async () => {
        if (!query.trim()) return;

        try {
            setLoading(true);
            setError("");

            const data = await searchStocks(query.trim());

            setResults(data);
        } catch (err) {
            console.error(err);
            setResults([]);
            setError("Unable to search stocks. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (stock: StockSearchResult) => {
        navigate(`/stock/${encodeURIComponent(stock.symbol)}`);
    };

    const handlePopularStock = (symbol: string) => {
        navigate(`/stock/${encodeURIComponent(symbol)}`);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main>
                <section className="relative overflow-hidden border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-8 lg:pb-24 lg:pt-24">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                <Sparkles size={14} />
                                AI-powered stock analysis
                            </div>

                            <h2 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                                Understand the market
                                <span className="block text-blue-600">
                                    with intelligent insights.
                                </span>
                            </h2>

                            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                                Search NSE and BSE stocks to explore market
                                data, historical performance, fundamentals,
                                news and AI-powered analysis.
                            </p>

                            <div className="mx-auto mt-9 max-w-2xl">
                                <div className="flex items-center rounded-2xl border border-slate-300 bg-white p-2 shadow-lg shadow-slate-200/60 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                                    <Search
                                        size={21}
                                        className="ml-3 shrink-0 text-slate-400"
                                    />

                                    <input
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                handleSearch();
                                            }
                                        }}
                                        placeholder="Search company or stock symbol..."
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                    />

                                    <button
                                        onClick={handleSearch}
                                        disabled={loading || !query.trim()}
                                        className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading ? "Searching..." : "Search"}
                                    </button>
                                </div>

                                {error && (
                                    <p className="mt-3 text-sm font-medium text-red-600">
                                        {error}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
                    <div className="mb-5">
                        <h3 className="section-title">
                            Popular Indian stocks
                        </h3>

                        <p className="section-description">
                            Quickly explore some commonly tracked companies.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {popularStocks.map((stock) => (
                            <button
                                key={stock.symbol}
                                onClick={() =>
                                    handlePopularStock(stock.symbol)
                                }
                                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700">
                                        {stock.symbol
                                            .replace(".NS", "")
                                            .slice(0, 2)}
                                    </div>

                                    <span className="text-xs font-semibold text-slate-400 transition group-hover:text-blue-600">
                                        NSE
                                    </span>
                                </div>

                                <p className="mt-5 text-sm font-bold text-slate-900">
                                    {stock.symbol.replace(".NS", "")}
                                </p>

                                <p className="mt-1 truncate text-sm text-slate-500">
                                    {stock.name}
                                </p>
                            </button>
                        ))}
                    </div>
                    <div className="mt-8">
                        <button
                            onClick={() => navigate("/investor-intelligence")}
                            className="group flex w-full flex-col gap-5 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-8"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                                    <ChartNoAxesCombined size={24} />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                        Investor Research
                                    </p>

                                    <h3 className="mt-1 text-xl font-bold text-slate-950">
                                        Investor Intelligence
                                    </h3>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                        Explore foreign investor activity, mutual fund holdings,
                                        ownership patterns, disclosed deals and
                                        insider trades across companies in the Indian market.
                                    </p>
                                </div>
                            </div>

                            <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-700 group-hover:gap-3">
                                Explore investors
                                <ArrowRight size={18} />
                            </span>
                        </button>
                    </div>
                    <div className="mt-10">
                        <SearchResults
                            results={results}
                            onSelect={handleSelect}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Dashboard;
