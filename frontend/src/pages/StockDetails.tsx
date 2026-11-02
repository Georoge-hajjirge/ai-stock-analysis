import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Sparkles,
    Star,
    TrendingUp,
} from "lucide-react";
import { useFavourites } from "../hooks/useFavourites";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";

import StockOverview from "../components/StockOverview";
import FundamentalsPanel from "../components/FundamentalsPanel";
import HistoricalChart from "../components/HistoricalChart";
import HistoricalData from "../components/HistoricalData";
import NewsPanel from "../components/NewsPanel";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import AIQuestionPanel, {
    type ChatMessage,
} from "../components/AIQuestionPanel";

import {
    getStockData,
    getHistoricalData,
    getFundamentals,
    getStockNews,
    getAIStockAnalysis,
    askAIStockQuestion,
} from "../services/stockService";

import type {
    StockData,
    StockFundamentals,
    HistoricalStockData,
    StockPeriod,
    NewsArticle,
} from "../types/stock";
import Header from "../components/Header";

function StockDetails() {
    const navigate = useNavigate();
    const { symbol } = useParams<{ symbol: string }>();

    const decodedSymbol = symbol
        ? decodeURIComponent(symbol)
        : "";

    const [stock, setStock] = useState<StockData | null>(null);

    const [fundamentals, setFundamentals] =
        useState<StockFundamentals | null>(null);

    const [historicalData, setHistoricalData] =
        useState<HistoricalStockData[]>([]);

    const [news, setNews] = useState<NewsArticle[]>([]);

    const [selectedPeriod, setSelectedPeriod] =
        useState<StockPeriod>("1M");

    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [newsLoading, setNewsLoading] = useState(true);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [questionLoading, setQuestionLoading] = useState(false);

    const [analysis, setAnalysis] = useState("");

    const [question, setQuestion] = useState("");

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!decodedSymbol) {
            navigate("/");
            return;
        }

        const loadStock = async () => {
            try {
                setLoading(true);
                setNewsLoading(true);
                setError("");

                setStock(null);
                setFundamentals(null);
                setHistoricalData([]);
                setNews([]);
                setAnalysis("");
                setQuestion("");
                setMessages([]);

                const [
                    stockData,
                    history,
                    fundamentalsData,
                    newsData,
                ] = await Promise.all([
                    getStockData(decodedSymbol),

                    getHistoricalData(
                        decodedSymbol,
                        selectedPeriod
                    ),

                    getFundamentals(decodedSymbol).catch(
                        () => null
                    ),

                    getStockNews(decodedSymbol).catch(
                        () => []
                    ),
                ]);

                setStock(stockData);
                setHistoricalData(history);
                setFundamentals(fundamentalsData);
                setNews(newsData);
            } catch (err) {
                console.error(err);

                setError(
                    "Unable to load stock information. Please try again."
                );
            } finally {
                setLoading(false);
                setNewsLoading(false);
            }
        };

        loadStock();
    }, [decodedSymbol, navigate]);



    const {
        isFavourite,
        addFavourite,
        removeFavourite,
        isAdding,
        isRemoving,
    } = useFavourites();

    const { user } = useAuth();

    const isInWatchlist = stock
        ? isFavourite(stock.symbol)
        : false;

    const handleWatchlistToggle = async () => {
        if (!stock) return;

        // Require login before modifying the watchlist.
        if (!user) {
            navigate(
                `/login?redirect=${encodeURIComponent(
                    `/stock/${encodeURIComponent(stock.symbol)}`
                )}`
            );
            return;
        }

        try {
            if (isInWatchlist) {
                await removeFavourite(stock.symbol);
            } else {
                await addFavourite({
                    symbol: stock.symbol,
                    name: stock.name || stock.symbol,
                    exchange:
                        stock.exchange ||
                        stock.symbol.split(".").pop() ||
                        "",
                });
            }
        } catch (err) {
            console.error("Failed to update watchlist:", err);
            setError("Unable to update watchlist. Please try again.");
        }
    };

    const handlePeriodChange = async (
        period: StockPeriod
    ) => {
        if (!stock) return;

        try {
            setSelectedPeriod(period);
            setHistoryLoading(true);
            setError("");

            const history = await getHistoricalData(
                stock.symbol,
                period
            );

            setHistoricalData(history);
        } catch (err) {
            console.error(err);

            setError(
                "Unable to load historical price data."
            );
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleGenerateAnalysis = async () => {
        if (!stock) return;

        try {
            setAnalysisLoading(true);
            setError("");

            const result = await getAIStockAnalysis(
                stock.symbol
            );

            setAnalysis(result);
        } catch (err) {
            console.error(err);

            setError(
                "Unable to generate AI analysis. Please try again."
            );
        } finally {
            setAnalysisLoading(false);
        }
    };

    const handleAskQuestion = async () => {
        if (!stock || !question.trim() || questionLoading) {
            return;
        }

        const userQuestion = question.trim();

        const userMessage: ChatMessage = {
            id: `${Date.now()}-user`,
            role: "user",
            content: userQuestion,
        };

        setMessages((previous) => [
            ...previous,
            userMessage,
        ]);

        setQuestion("");
        setError("");

        try {
            setQuestionLoading(true);

            const result = await askAIStockQuestion(
                stock.symbol,
                userQuestion,
                messages
            );

            const assistantMessage: ChatMessage = {
                id: `${Date.now()}-assistant`,
                role: "assistant",
                content: result,
            };

            setMessages((previous) => [
                ...previous,
                assistantMessage,
            ]);
        } catch (err) {
            console.error(err);

            setError(
                "Unable to get an AI answer. Please try again."
            );
        } finally {
            setQuestionLoading(false);
        }
    };

    const handleClearChat = () => {
        if (questionLoading) return;

        setMessages([]);
        setQuestion("");
        setError("");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-7xl items-center px-5 py-4 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                                <TrendingUp size={20} />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-slate-950">
                                    AI Stock Intelligence
                                </p>

                                <p className="text-xs text-slate-500">
                                    Indian market insights
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-5 w-28 rounded bg-slate-200" />

                        <div className="rounded-2xl border border-slate-200 bg-white p-7">
                            <div className="h-7 w-72 rounded bg-slate-200" />

                            <div className="mt-3 h-4 w-40 rounded bg-slate-200" />

                            <div className="mt-8 h-12 w-48 rounded bg-slate-200" />

                            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                                {Array.from({
                                    length: 8,
                                }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-20 rounded-xl bg-slate-100"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="h-96 rounded-2xl bg-white" />
                    </div>
                </main>
            </div>
        );
    }

    if (!stock) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header showBack />

                <div className="flex items-center justify-center px-5 py-24">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                            !
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-slate-950">
                            Stock unavailable
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {error ||
                                "We couldn't load information for this stock."}
                        </p>

                        <button
                            onClick={() => navigate("/")}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-slate-50">
            <Header showBack />

            <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
                {error && (
                    <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span>{error}</span>

                        <button
                            onClick={() => setError("")}
                            className="font-semibold"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                <div className="mb-8">
                    <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                        <button
                            onClick={() => navigate("/")}
                            className="hover:text-slate-950"
                        >
                            Dashboard
                        </button>

                        <span>/</span>

                        <span className="font-medium text-slate-700">
                            {stock.symbol}
                        </span>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                                    {stock.name ||
                                        stock.symbol}
                                </h1>

                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                    {stock.exchange ||
                                        "Indian Market"}
                                </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-500">
                                {stock.symbol} · Live market
                                information and AI-powered
                                insights
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                            <button
                                onClick={handleWatchlistToggle}
                                disabled={isAdding || isRemoving}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isInWatchlist
                                        ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                        : "bg-amber-500 text-white hover:bg-amber-600"
                                    }`}
                            >
                                <Star
                                    size={16}
                                    fill={isInWatchlist ? "currentColor" : "none"}
                                />

                                {isAdding || isRemoving
                                    ? "Updating..."
                                    : isInWatchlist
                                        ? "Remove from Watchlist"
                                        : "Add to Watchlist"}
                            </button>

                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Market Data Available
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <StockOverview stock={stock} />

                    <FundamentalsPanel
                        data={fundamentals}
                    />

                    <HistoricalChart
                        data={historicalData}
                        period={selectedPeriod}
                        onPeriodChange={
                            handlePeriodChange
                        }
                        loading={historyLoading}
                    />

                    <HistoricalData
                        data={historicalData}
                    />

                    <NewsPanel
                        data={news}
                        loading={newsLoading}
                    />

                    <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 shadow-sm sm:p-7">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700">
                                    <Sparkles size={14} />
                                    AI Intelligence
                                </div>

                                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                                    Understand{" "}
                                    {stock.symbol} with AI
                                </h2>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                    Generate an AI-powered analysis
                                    using market data, historical
                                    performance, fundamentals and
                                    recent news.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <AIAnalysisPanel
                                analysis={analysis}
                                loading={analysisLoading}
                                onGenerate={
                                    handleGenerateAnalysis
                                }
                            />
                        </div>
                    </section>

                    <AIQuestionPanel
                        question={question}
                        messages={messages}
                        loading={questionLoading}
                        onQuestionChange={setQuestion}
                        onAsk={handleAskQuestion}
                        onClear={handleClearChat}
                    />
                </div>

                <div className="mt-10 border-t border-slate-200 pt-6 text-center">
                    <p className="text-xs leading-5 text-slate-400">
                        AI-generated information is for
                        informational purposes only and should not
                        be considered financial advice.
                    </p>
                </div>
            </main>
        </div>
    );
}

export default StockDetails;