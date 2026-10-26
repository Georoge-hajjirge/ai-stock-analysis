import {
    Activity,
    ArrowDown,
    ArrowUp,
    BarChart3,
    CalendarDays,
    Clock3,
    IndianRupee,
} from "lucide-react";
import type { StockData } from "../types/stock";

interface StockOverviewProps {
    stock: StockData;
}

const formatPrice = (value?: number) =>
    value !== undefined && value !== null
        ? `₹${value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`
        : "-";

const formatNumber = (value?: number) =>
    value !== undefined && value !== null
        ? value.toLocaleString("en-IN")
        : "-";

function StockOverview({ stock }: StockOverviewProps) {
    const isPositive = (stock.change ?? 0) >= 0;

    const rangeLow = stock.fiftyTwoWeekLow;
    const rangeHigh = stock.fiftyTwoWeekHigh;
    const currentPrice = stock.price;

    const rangePercentage =
        rangeLow !== undefined &&
            rangeHigh !== undefined &&
            currentPrice !== undefined &&
            rangeHigh > rangeLow
            ? Math.min(
                100,
                Math.max(
                    0,
                    ((currentPrice - rangeLow) /
                        (rangeHigh - rangeLow)) *
                    100
                )
            )
            : null;

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-6 sm:px-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
                                <IndianRupee size={22} />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                                        {stock.name ||
                                            stock.symbol}
                                    </h2>

                                    <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                                        {stock.exchange ||
                                            "Market"}
                                    </span>
                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    {stock.symbol}
                                </p>
                            </div>
                        </div>

                        <div className="mt-7 flex flex-wrap items-end gap-x-5 gap-y-2">
                            <div className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                                {formatPrice(stock.price)}
                            </div>

                            <div
                                className={`mb-1 flex items-center gap-1.5 text-base font-bold ${isPositive
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                    }`}
                            >
                                {isPositive ? (
                                    <ArrowUp size={18} />
                                ) : (
                                    <ArrowDown size={18} />
                                )}

                                <span>
                                    {stock.change !==
                                        undefined
                                        ? `${isPositive
                                            ? "+"
                                            : ""
                                        }${stock.change.toFixed(
                                            2
                                        )}`
                                        : "-"}
                                </span>

                                <span>
                                    (
                                    {stock.changePercent !==
                                        undefined
                                        ? `${isPositive
                                            ? "+"
                                            : ""
                                        }${stock.changePercent.toFixed(
                                            2
                                        )}%`
                                        : "-"}
                                    )
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                                <Clock3 size={13} />
                                Market data
                            </span>

                            {stock.timestamp && (
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays size={13} />
                                    {new Date(
                                        stock.timestamp * 1000
                                    ).toLocaleString(
                                        "en-IN",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    <div
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${isPositive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                            }`}
                    >
                        <span
                            className={`h-2 w-2 rounded-full ${isPositive
                                ? "bg-emerald-500"
                                : "bg-red-500"
                                }`}
                        />

                        {isPositive
                            ? "Positive movement"
                            : "Negative movement"}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 lg:grid-cols-8 lg:divide-y-0">
                <Metric
                    label="Previous Close"
                    value={formatPrice(stock.previousClose)}
                />

                <Metric
                    label="Open"
                    value={formatPrice(stock.open)}
                />

                <Metric
                    label="Day High"
                    value={formatPrice(stock.high)}
                />

                <Metric
                    label="Day Low"
                    value={formatPrice(stock.low)}
                />

                <Metric
                    label="Volume"
                    value={formatNumber(stock.volume)}
                    icon={<BarChart3 size={14} />}
                />

                <Metric
                    label="52W High"
                    value={formatPrice(
                        stock.fiftyTwoWeekHigh
                    )}
                />

                <Metric
                    label="52W Low"
                    value={formatPrice(
                        stock.fiftyTwoWeekLow
                    )}
                />

                <Metric
                    label="Currency"
                    value={stock.currency || "INR"}
                    icon={<IndianRupee size={14} />}
                />
            </div>

            {rangePercentage !== null && (
                <div className="border-t border-slate-100 px-6 py-6 sm:px-7">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Activity
                                    size={16}
                                    className="text-slate-500"
                                />

                                <h3 className="text-sm font-bold text-slate-900">
                                    52-week price range
                                </h3>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Current price relative to the
                                yearly high and low
                            </p>
                        </div>

                        <span className="text-sm font-bold text-slate-700">
                            {rangePercentage.toFixed(0)}%
                        </span>
                    </div>

                    <div className="mt-5">
                        <div className="relative h-2 rounded-full bg-slate-100">
                            <div
                                className="absolute left-0 top-0 h-2 rounded-full bg-blue-600 transition-all duration-500"
                                style={{
                                    width: `${rangePercentage}%`,
                                }}
                            />

                            <div
                                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow-sm"
                                style={{
                                    left: `${rangePercentage}%`,
                                }}
                            />
                        </div>

                        <div className="mt-3 flex justify-between text-xs">
                            <div>
                                <span className="block text-slate-400">
                                    52W Low
                                </span>
                                <span className="mt-0.5 block font-semibold text-slate-700">
                                    {formatPrice(rangeLow)}
                                </span>
                            </div>

                            <div className="text-right">
                                <span className="block text-slate-400">
                                    52W High
                                </span>
                                <span className="mt-0.5 block font-semibold text-slate-700">
                                    {formatPrice(rangeHigh)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

interface MetricProps {
    label: string;
    value: string;
    icon?: React.ReactNode;
}

function Metric({ label, value, icon }: MetricProps) {
    return (
        <div className="min-h-[88px] px-4 py-4 sm:px-5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                {icon}
                <span>{label}</span>
            </div>

            <p className="mt-2 truncate text-sm font-bold text-slate-900">
                {value}
            </p>
        </div>
    );
}

export default StockOverview;
