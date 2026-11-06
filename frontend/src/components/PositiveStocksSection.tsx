import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getPositiveStocks } from "../services/stockService";
import type {
    Outlook,
    PositiveStocksResult,
    SignalKind,
} from "../types/stock";

const chipStyles: Record<SignalKind, string> = {
    news: "border-blue-200 bg-blue-50 text-blue-700",
    momentum: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
};

const outlookStyles: Record<Outlook, string> = {
    Strong: "border-emerald-300 bg-emerald-100 text-emerald-800",
    Moderate: "border-sky-200 bg-sky-50 text-sky-700",
    Mild: "border-slate-200 bg-slate-100 text-slate-600",
};

function PositiveStocksSection() {
    const navigate = useNavigate();

    const [data, setData] = useState<PositiveStocksResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getPositiveStocks()
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((err) => {
                console.error(err);
                if (!cancelled) {
                    setError("Unable to load stocks to watch. Please try again later.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const items = data?.items ?? [];

    const updated = data
        ? new Date(data.generatedAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "";

    return (
        <section className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8">
            <div className="mb-7">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <TrendingUp size={17} />
                    NEXT SESSION OUTLOOK
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    Stocks to Watch
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {data
                        ? `Stocks that may rise in the ${data.targetSession} session, based on today's news and market activity. Updated ${updated} IST.`
                        : "Stocks that may rise in the next trading session, based on today's news and market activity."}{" "}
                    Estimates only. Nothing is guaranteed and this is not investment advice.
                </p>
            </div>

            {loading && (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
                        />
                    ))}
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
                >
                    {error}
                </div>
            )}

            {!loading && !error && items.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    No stocks with clear positive signals right now. Check back after the next update.
                </div>
            )}

            {items.length > 0 && (
                <>
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {items.map((item, index) => {
                            const isUp = (item.changePercent ?? 0) >= 0;

                            return (
                                <button
                                    key={item.symbol}
                                    type="button"
                                    onClick={() =>
                                        navigate(`/stock/${encodeURIComponent(item.symbol)}`)
                                    }
                                    className="grid w-full grid-cols-[auto_1fr_auto] items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                                        {index + 1}
                                    </span>

                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900">
                                            {item.name}
                                            <span className="ml-2 text-xs font-medium text-slate-400">
                                                {item.symbol.replace(".NS", "")}
                                            </span>
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            {item.reason}
                                        </p>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {item.outlook && (
                                                <span
                                                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${outlookStyles[item.outlook]}`}
                                                >
                                                    {item.outlook} outlook
                                                </span>
                                            )}

                                            {item.signals.map((signal) => (
                                                <span
                                                    key={signal.label}
                                                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${chipStyles[signal.kind]}`}
                                                >
                                                    {signal.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        {item.price !== undefined && (
                                            <p className="text-sm font-bold text-slate-900">
                                                ₹
                                                {item.price.toLocaleString("en-IN", {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        )}

                                        {item.changePercent !== undefined && (
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Today{" "}
                                                <span
                                                    className={`font-semibold ${isUp ? "text-emerald-600" : "text-red-600"
                                                        }`}
                                                >
                                                    {isUp ? "▲" : "▼"}{" "}
                                                    {Math.abs(item.changePercent).toFixed(2)}%
                                                </span>
                                            </p>
                                        )}

                                        {item.expectedMove && (
                                            <p
                                                className="mt-1 text-xs text-slate-500"
                                                title={`Estimate based on this stock's typical daily move (${item.typicalMovePercent}%) and the strength of today's signals. Not a guarantee.`}
                                            >
                                                Tomorrow{" "}
                                                <span className="font-semibold text-emerald-600">
                                                    may rise {item.expectedMove.low}% –{" "}
                                                    {item.expectedMove.high}%
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                        "Tomorrow" ranges are estimates based on each stock's typical daily
                        movement and the strength of today's signals. Actual moves can be
                        higher, lower or negative.
                    </p>
                </>
            )}
        </section>
    );
}

export default PositiveStocksSection;