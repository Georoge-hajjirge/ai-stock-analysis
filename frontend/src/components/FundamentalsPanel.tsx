import {
    BarChart3,
    CircleDollarSign,
    Percent,
    TrendingUp,
    CalendarDays,
    Layers,
} from "lucide-react";

import type { StockFundamentals } from "../types/stock";

interface FundamentalsPanelProps {
    data: StockFundamentals | null;
}

const format = (value?: number) =>
    value !== undefined && value !== null && Number.isFinite(value)
        ? value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
        : "-";

const currency = (value?: number) =>
    value !== undefined && value !== null && Number.isFinite(value)
        ? `₹${format(value)}`
        : "-";

const percent = (value?: number) =>
    value !== undefined && value !== null && Number.isFinite(value)
        ? `${format(value)}%`
        : "-";

const marketCap = (value?: number) => {
    if (value === undefined || value === null || !Number.isFinite(value)) {
        return "-";
    }

    return `₹${(value / 1e7).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    })} Cr`;
};

const sharesInCrores = (value?: number) => {
    if (value === undefined || value === null || !Number.isFinite(value)) {
        return "-";
    }

    return `${(value / 1e7).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    })} Cr`;
};

const dateFormat = (value?: string) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
};
const fiscalYearStart = (fy?: string) => {
    const match = fy?.match(/^(\d{4})-\d{2,4}$/);
    return match ? Number(match[1]) : null;
};

const fiscalYearRange = (fy?: string) => {
    const start = fiscalYearStart(fy);
    return start ? `Apr ${start} – Mar ${start + 1}` : "-";
};

const monthsSinceFiscalYearEnd = (fy?: string, asOf?: string) => {
    const start = fiscalYearStart(fy);
    if (!start || !asOf) return null;

    const fyEnd = Date.UTC(start + 1, 2, 31); // 31 March
    const asOfTime = new Date(asOf).getTime();
    if (Number.isNaN(asOfTime) || asOfTime < fyEnd) return null;

    return Math.round((asOfTime - fyEnd) / (1000 * 60 * 60 * 24 * 30.44));
};
function FundamentalsPanel({ data }: FundamentalsPanelProps) {
    if (!data) {
        return (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <BarChart3 size={19} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-950">
                            Fundamentals
                        </h2>
                        <p className="text-sm text-slate-500">
                            Fundamental metrics are currently unavailable.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    const metrics = [
        {
            label: "Current Price",
            value: currency(data.price),
            description: "Latest reported price",
            icon: CircleDollarSign,
        },
        {
            label: "Market Cap",
            value: marketCap(data.marketCap),
            description: "Company valuation",
            icon: CircleDollarSign,
        },
        {
            label: "P/E Ratio",
            value: format(data.trailingPE),
            description: "Price to earnings",
            icon: BarChart3,
        },
        {
            label: "P/B Ratio",
            value: format(data.priceToBook),
            description: "Price to book",
            icon: BarChart3,
        },
        {
            label: "EPS",
            value: currency(data.eps),
            description: "Earnings per share",
            icon: TrendingUp,
        },
        {
            label: "Book Value / Share",
            value: currency(data.bookValuePerShare),
            description: "Book value per share",
            icon: Layers,
        },
        {
            label: "ROE",
            value: percent(data.returnOnEquity),
            description: "Return on equity",
            icon: TrendingUp,
        },
        {
            label: "ROCE",
            value: percent(data.returnOnCapitalEmployed),
            description: "Return on capital employed",
            icon: TrendingUp,
        },
        {
            label: "Dividend Yield",
            value: percent(data.dividendYield),
            description: "Reported dividend yield",
            icon: Percent,
        },
        {
            label: "Face Value",
            value: currency(data.faceValue),
            description: "Face value per share",
            icon: CircleDollarSign,
        },
        {
            label: "52W High",
            value: currency(data.fiftyTwoWeekHigh),
            description: "52-week highest price",
            icon: TrendingUp,
        },
        {
            label: "52W Low",
            value: currency(data.fiftyTwoWeekLow),
            description: "52-week lowest price",
            icon: TrendingUp,
        },
        {
            label: "Shares Outstanding",
            value: sharesInCrores(data.sharesOutstanding),
            description: "Total shares in crore",
            icon: Layers,
        },
    ];

    const gapMonths = monthsSinceFiscalYearEnd(
        data.financialsFiscalYear,
        data.asOfDate
    );

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <BarChart3 size={19} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-950">
                            Fundamentals
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Financial metrics for {data.symbol}
                        </p>
                    </div>
                </div>

                <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600">
                    {data.financialsPeriodType || "Fundamental"} overview
                </span>
            </div>

            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-3 sm:px-7">
                <h3 className="text-sm font-semibold text-slate-700">
                    Valuation & Financial Performance
                </h3>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3 md:grid-cols-4">
                {metrics.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <div
                            key={metric.label}
                            className="group min-w-0 p-4 transition hover:bg-slate-50 sm:p-5"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-slate-500">
                                    {metric.label}
                                </span>
                                <Icon
                                    size={15}
                                    className="shrink-0 text-slate-300 transition group-hover:text-blue-500"
                                />
                            </div>

                            <p className="mt-3 break-words text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                                {metric.value}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-slate-400">
                                {metric.description}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-7">
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">
                            Data freshness
                        </h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        The numbers above come from two different dates.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                            Company results (older)
                        </p>
                        <p className="mt-2 text-base font-bold capitalize text-teal-950">
                            {data.financialsPeriodType || "-"} report · FY{" "}
                            {data.financialsFiscalYear || "-"}
                        </p>
                        <p className="mt-1 text-sm text-teal-800">
                            {fiscalYearRange(data.financialsFiscalYear)}
                        </p>
                        <p className="mt-3 text-xs text-teal-700">
                            Used for: EPS, Book Value, ROE, ROCE
                        </p>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Market price (latest)
                        </p>
                        <p className="mt-2 text-base font-bold text-amber-950">
                            {dateFormat(data.asOfDate)}
                        </p>
                        <p className="mt-1 text-sm text-amber-800">Price snapshot date</p>
                        <p className="mt-3 text-xs text-amber-700">
                            Used for: Price, Market Cap, 52W High/Low
                        </p>
                    </div>
                </div>

                {gapMonths !== null && gapMonths > 0 && (
                    <p className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                        The financials end about{" "}
                        <span className="font-semibold">{gapMonths} months</span> before
                        the price date. Ratios like P/E mix today's price with older
                        earnings.
                    </p>
                )}

                <p className="mt-3 text-xs leading-5 text-slate-500">
                    Missing values are shown as "-" instead of being estimated.
                </p>
            </div>
        </section>
    );
}

export default FundamentalsPanel;
