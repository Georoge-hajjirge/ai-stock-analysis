import { useState } from "react";
import type { HistoricalStockData } from "../types/stock";

interface HistoricalDataProps {
    data: HistoricalStockData[];
}

const ITEMS_PER_PAGE = 10;

function HistoricalData({ data }: HistoricalDataProps) {
    const [currentPage, setCurrentPage] = useState(1);

    if (data.length === 0) return null;

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentData = data.slice(startIndex, endIndex);

    const handlePrevious = () =>
        setCurrentPage((page) => Math.max(page - 1, 1));

    const handleNext = () =>
        setCurrentPage((page) => Math.min(page + 1, totalPages));

    return (
        <div className="mt-8 w-full max-w-4xl rounded-xl bg-white p-6 shadow-md">
            <div className="mb-4">
                <h2 className="text-xl font-bold">Historical Data</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of{" "}
                    {data.length} records
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            {["Date", "Open", "High", "Low", "Close", "Volume"].map(
                                (heading) => (
                                    <th key={heading} className="p-3">
                                        {heading}
                                    </th>
                                )
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {currentData.map((item) => (
                            <tr
                                key={item.timestamp}
                                className="border-b hover:bg-gray-50"
                            >
                                <td className="p-3">
                                    {new Date(item.date).toLocaleDateString(
                                        "en-IN",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        }
                                    )}
                                </td>

                                <td className="p-3">
                                    {item.open != null
                                        ? `₹${item.open.toFixed(2)}`
                                        : "-"}
                                </td>

                                <td className="p-3">
                                    {item.high != null
                                        ? `₹${item.high.toFixed(2)}`
                                        : "-"}
                                </td>

                                <td className="p-3">
                                    {item.low != null
                                        ? `₹${item.low.toFixed(2)}`
                                        : "-"}
                                </td>

                                <td className="p-3 font-semibold">
                                    {item.close != null
                                        ? `₹${item.close.toFixed(2)}`
                                        : "-"}
                                </td>

                                <td className="p-3">
                                    {item.volume != null
                                        ? item.volume.toLocaleString("en-IN")
                                        : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between">
                    <button
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Previous
                    </button>

                    <span className="text-sm font-medium text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default HistoricalData;