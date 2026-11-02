import { useState } from "react";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import type { HistoricalStockData } from "../types/stock";

interface HistoricalDataProps {
    data: HistoricalStockData[];
}

const ITEMS_PER_PAGE = 10;

const price = (value?: number | null) =>
    value != null
        ? `₹${value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`
        : "-";

function HistoricalData({ data }: HistoricalDataProps) {
    const [currentPage, setCurrentPage] = useState(1);

    if (data.length === 0) return null;

    const sortedData = [...data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
    const page = Math.min(currentPage, totalPages);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sortedData.length);
    const currentData = sortedData.slice(startIndex, endIndex);

    const getChange = (index: number) => {
        const today = sortedData[index]?.close;
        const previous = sortedData[index + 1]?.close;
        if (today == null || previous == null || previous === 0) return null;
        return ((today - previous) / previous) * 100;
    };

    const handlePrevious = () => setCurrentPage(Math.max(page - 1, 1));
    const handleNext = () => setCurrentPage(Math.min(page + 1, totalPages));

    const headings = [
        { label: "Date", align: "text-left" },
        { label: "Open", align: "text-right" },
        { label: "High", align: "text-right" },
        { label: "Low", align: "text-right" },
        { label: "Close", align: "text-right" },
        { label: "Change", align: "text-right" },
        { label: "Volume", sub: "Shares traded that day", align: "text-right" },
    ];
    return (
        <section className="mt-8 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <History size={19} />
                </div>

                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-950">
                        Historical Data
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                        Prices, newest first
                    </p>
                </div>
            </div>

            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {startIndex + 1}-{endIndex} of {sortedData.length} records
            </span>
        </div>

            <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap text-sm">
                    <thead className="bg-slate-50/70">
                        <tr className="border-b border-slate-100">
                            {headings.map((h) => (
                                <th
                                    key={h.label}
                                    className={`px-4 py-3 align-bottom text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-6 last:pr-6 sm:first:pl-7 sm:last:pr-7 ${h.align}`}
                                >
                                    {h.label}
                                    {h.sub && (
                                        <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-slate-400">
                                            {h.sub}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {currentData.map((item, i) => {
                            const change = getChange(startIndex + i);
                            const isUp = change !== null && change > 0;
                            const isDown = change !== null && change < 0;

                            return (
                                <tr
                                    key={item.timestamp}
                                    className="transition hover:bg-slate-50"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-800 first:pl-6 sm:first:pl-7">                                        {new Date(item.date).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                    </td>

                                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                                        {price(item.open)}
                                    </td>

                                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                                        {price(item.high)}
                                    </td>

                                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                                        {price(item.low)}
                                    </td>

                                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                                        {price(item.close)}
                                    </td>

                                    <td
                                        className={`px-4 py-3 text-right text-xs font-semibold tabular-nums ${isUp
                                            ? "text-emerald-600"
                                            : isDown
                                                ? "text-red-600"
                                                : "text-slate-400"
                                            }`}
                                    >
                                        {change === null
                                            ? "-"
                                            : `${isUp ? "+" : ""}${change.toFixed(2)}%`}
                                    </td>

                                    <td className="px-4 py-3 pr-6 text-right tabular-nums text-slate-600 sm:pr-7">
                                        {item.volume != null
                                            ? item.volume.toLocaleString("en-IN")
                                            : "-"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {
                totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-7">
                        <button
                            onClick={handlePrevious}
                            disabled={page === 1}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="text-sm font-medium text-slate-600">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            onClick={handleNext}
                            disabled={page === totalPages}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )
            }
        </section >
    );
}

export default HistoricalData;