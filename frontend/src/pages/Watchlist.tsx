
import { useCallback, useEffect, useState } from "react";
import {
    RefreshCw,
    Star,
    Trash2,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { StockData } from "../types/stock";
import { getStockData } from "../services/stockService";
import { useFavourites } from "../hooks/useFavourites";
import Header from "../components/Header";

function formatPrice(price?: number, currency = "INR") {
    if (price === undefined || !Number.isFinite(price)) {
        return "—";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(price);
}

export default function Watchlist() {
    const navigate = useNavigate();

    const {
        favourites,
        isLoading: favouritesLoading,
        removeFavourite,
    } = useFavourites();

    const [stockData, setStockData] = useState<Record<string, StockData>>({});
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [error, setError] = useState("");
    const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const loadStockPrices = useCallback(async () => {
        setError("");

        if (favourites.length === 0) {
            setStockData({});
            setLoadingPrices(false);
            return;
        }

        setLoadingPrices(true);

        try {
            const results = await Promise.allSettled(
                favourites.map(async (item) => ({
                    symbol: item.symbol,
                    stock: await getStockData(item.symbol),
                }))
            );

            const updatedData: Record<string, StockData> = {};

            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    updatedData[result.value.symbol] = result.value.stock;
                }
            });

            setStockData(updatedData);

            if (results.every((result) => result.status === "rejected")) {
                setError("Unable to load stock prices. Please try again.");
            }
        } catch {
            setError("Unable to load stock prices. Please try again.");
        } finally {
            setLoadingPrices(false);
        }
    }, [favourites]);

    useEffect(() => {
        if (!favouritesLoading) {
            void loadStockPrices();
        }
    }, [favouritesLoading, loadStockPrices]);

    const handleRemove = async (symbol: string) => {
        setError("");
        setRemovingSymbol(symbol);

        try {
            await removeFavourite(symbol);

            setStockData((current) => {
                const updated = { ...current };
                delete updated[symbol];
                return updated;
            });
        } catch {
            setError(`Unable to remove ${symbol}. Please try again.`);
        } finally {
            setRemovingSymbol(null);
        }
    };

    const loading = favouritesLoading || loadingPrices;
    const confirmRemove = (symbol: string) => {
        setSelectedSymbol(symbol);
        setShowDeleteModal(true);
    };

    const handleConfirmRemove = async () => {
        if (!selectedSymbol) return;

        await handleRemove(selectedSymbol);
        setShowDeleteModal(false);
        setSelectedSymbol(null);
    };
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Header
                showBack
                actions={
                    <button
                        onClick={() => void loadStockPrices()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={14}
                            className={loading ? "animate-spin" : ""}
                        />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                }
            />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Saved Stocks
                            </p>
                            <Star size={19} className="text-amber-500" />
                        </div>
                        <p className="mt-3 text-3xl font-bold">
                            {favourites.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Stocks Loaded
                            </p>
                            <TrendingUp size={19} className="text-emerald-600" />
                        </div>
                        <p className="mt-3 text-3xl font-bold">
                            {Object.keys(stockData).length}
                        </p>
                    </div>


                </div>

                {error && (
                    <div
                        role="alert"
                        className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {favouritesLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
                        Loading your saved stocks...
                    </div>
                ) : favourites.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                        <Star size={38} className="mx-auto text-slate-300" />
                        <h2 className="mt-4 text-lg font-semibold">
                            Your watchlist is empty
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            Search for a stock on the dashboard and add it
                            to your watchlist to track it here.
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Explore Stocks
                        </button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="font-semibold">Tracked Stocks</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Latest prices from your stock data service.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Stock</th>
                                        <th className="px-5 py-4">Price</th>
                                        <th className="px-5 py-4">Change</th>
                                        <th className="px-5 py-4">Added</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {favourites.map((item) => {
                                        const stock = stockData[item.symbol];
                                        const change = stock?.changePercent ?? 0;
                                        const hasChange =
                                            stock?.changePercent !== undefined;
                                        const positive = change >= 0;

                                        return (
                                            <tr
                                                key={item.symbol}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4">
                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                `/stock/${encodeURIComponent(item.symbol)}`
                                                            )
                                                        }
                                                        className="text-left"
                                                    >
                                                        <span className="font-semibold text-slate-900 hover:text-blue-600">
                                                            {item.name}
                                                        </span>
                                                        <span className="mt-1 block text-xs text-slate-500">
                                                            {item.symbol}
                                                            {item.exchange
                                                                ? ` · ${item.exchange}`
                                                                : ""}
                                                        </span>
                                                    </button>
                                                </td>

                                                <td className="px-5 py-4 font-semibold">
                                                    {stock
                                                        ? formatPrice(
                                                            stock.price,
                                                            stock.currency
                                                        )
                                                        : "—"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {hasChange ? (
                                                        <span
                                                            className={`inline-flex items-center gap-1 font-medium ${positive
                                                                ? "text-emerald-600"
                                                                : "text-red-600"
                                                                }`}
                                                        >
                                                            {positive ? (
                                                                <TrendingUp size={15} />
                                                            ) : (
                                                                <TrendingDown size={15} />
                                                            )}
                                                            {positive ? "+" : ""}
                                                            {change.toFixed(2)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-slate-500">
                                                    {new Date(
                                                        item.addedAt
                                                    ).toLocaleDateString("en-IN")}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    `/stock/${encodeURIComponent(item.symbol)}`
                                                                )
                                                            }
                                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-100"
                                                        >
                                                            Details
                                                        </button>

                                                        <button
                                                            onClick={() => confirmRemove(item.symbol)}
                                                            aria-label={`Remove ${item.symbol}`}
                                                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 size={17} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
                    onClick={() => {
                        if (!removingSymbol) {
                            setShowDeleteModal(false);
                            setSelectedSymbol(null);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-modal-title"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <Trash2 size={22} />
                        </div>

                        <h2
                            id="delete-modal-title"
                            className="mt-4 text-lg font-bold text-slate-900"
                        >
                            Remove from Watchlist?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-slate-900">
                                {selectedSymbol}
                            </span>{" "}
                            from your watchlist? This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedSymbol(null);
                                }}
                                disabled={Boolean(removingSymbol)}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => void handleConfirmRemove()}
                                disabled={
                                    !selectedSymbol ||
                                    Boolean(removingSymbol)
                                }
                                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {removingSymbol
                                    ? "Removing..."
                                    : "Remove"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
