import { useEffect, useState } from "react";
import {
    fetchMarketBulkDeals,
    fetchMarketBlockDeals,
    fetchMarketInsiderTrades,
} from "../../services/investorIntelligenceApi";
import type {
    ApiPagination,
    InvestorTransaction,
} from "../../types/investorIntelligence";

type DealKind = "bulk" | "block" | "insider";

interface Props {
    kind: DealKind;
}

const number = (value: number | null | undefined) =>
    value == null
        ? "N/A"
        : new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2,
        }).format(value);

const money = (value: number | null | undefined) =>
    value == null ? "N/A" : `₹${number(value)} `;

export default function MarketTransactions({ kind }: Props) {
    const [rows, setRows] = useState<InvestorTransaction[]>([]);
    const [pagination, setPagination] = useState<ApiPagination | null>(null);
    const [page, setPage] = useState(1);
    const [buySell, setBuySell] = useState<"" | "BUY" | "SELL">("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError("");

        const request =
            kind === "insider"
                ? fetchMarketInsiderTrades(page, 20)
                : kind === "bulk"
                    ? fetchMarketBulkDeals(page, 20, buySell || undefined)
                    : fetchMarketBlockDeals(page, 20, buySell || undefined);

        request
            .then((result) => {
                if (!active) return;

                setRows(result.transactions ?? []);
                setPagination(result.pagination ?? null);
            })
            .catch((err: unknown) => {
                if (!active) return;

                setRows([]);
                setPagination(null);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load market transaction data."
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [kind, page, buySell]);

    const title =
        kind === "bulk"
            ? "Market-wide bulk deals"
            : kind === "block"
                ? "Market-wide block deals"
                : "Market-wide insider trades";

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {kind === "insider"
                            ? "Publicly disclosed transactions by promoters, directors, employees, and other connected persons."
                            : "Disclosed transactions across companies, not just one stock."}
                    </p>
                </div>

                {kind !== "insider" && (
                    <select
                        value={buySell}
                        onChange={(event) => {
                            setBuySell(
                                event.target.value as "" | "BUY" | "SELL"
                            );
                            setPage(1);
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        aria-label="Filter transaction type"
                    >
                        <option value="">All transactions</option>
                        <option value="BUY">Buy</option>
                        <option value="SELL">Sell</option>
                    </select>
                )}
            </div>

            {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {loading ? (
                <p className="text-sm text-gray-500">
                    Loading {kind === "insider" ? "insider trades" : "market-wide deals"}...
                </p>
            ) : !error && rows.length === 0 ? (
                <p className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
                    No transaction records were returned.
                </p>
            ) : !error ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full min-w-[1050px] text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Company</th>
                                <th className="p-3">
                                    {kind === "insider" ? "Insider / Entity" : "Investor"}
                                </th>
                                <th className="p-3">Transaction</th>
                                <th className="p-3">Quantity</th>
                                <th className="p-3">Price</th>
                                <th className="p-3">Reported value</th>
                                <th className="p-3">
                                    {kind === "insider" ? "Promoter status" : "Category"}
                                </th>
                                {kind === "insider" && (
                                    <th className="p-3">Holding after (%)</th>
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row, index) => {
                                const transaction = (
                                    row.transactionType ?? ""
                                ).toLowerCase();

                                const isBuy =
                                    transaction.includes("buy") ||
                                    transaction.includes("acquisition");

                                const isSell =
                                    transaction.includes("sell") ||
                                    transaction.includes("disposal");

                                return (
                                    <tr
                                        key={`${row.symbol ?? ""} -${row.name} -${row.date} -${index} `}
                                        className="border-t border-gray-100"
                                    >
                                        <td className="p-3">
                                            {row.date ?? "N/A"}
                                        </td>

                                        <td className="p-3">
                                            <p className="font-medium text-gray-900">
                                                {row.companyName || row.symbol || "N/A"}
                                            </p>
                                            {row.companyName && row.symbol && (
                                                <p className="text-xs text-gray-500">
                                                    {row.symbol}
                                                </p>
                                            )}
                                        </td>

                                        <td className="p-3">
                                            {row.name || "N/A"}
                                        </td>

                                        <td className="p-3">
                                            <span
                                                className={`rounded - full px - 2 py - 1 text - xs ${isBuy
                                                        ? "bg-green-50 text-green-700"
                                                        : isSell
                                                            ? "bg-red-50 text-red-700"
                                                            : "bg-gray-100 text-gray-700"
                                                    } `}
                                            >
                                                {row.transactionType || "N/A"}
                                            </span>
                                        </td>

                                        <td className="p-3">
                                            {number(row.quantity)}
                                        </td>
                                        <td className="p-3">
                                            {money(row.price)}
                                        </td>
                                        <td className="p-3">
                                            {money(row.value)}
                                        </td>

                                        <td className="p-3">
                                            {kind === "insider"
                                                ? row.isPromoter === true
                                                    ? "Promoter"
                                                    : row.isPromoter === false
                                                        ? "Non-promoter"
                                                        : row.category || "N/A"
                                                : row.category || row.mode || "N/A"}
                                        </td>

                                        {kind === "insider" && (
                                            <td className="p-3">
                                                {row.sharesAfterPct == null
                                                    ? "N/A"
                                                    : `${number(row.sharesAfterPct)}% `}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : null}

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-500">
                        Page {pagination.page} of {pagination.totalPages}
                        {" · "}
                        {number(pagination.totalItems)} records
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((current) => current - 1)}
                            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={page >= pagination.totalPages || loading}
                            onClick={() => setPage((current) => current + 1)}
                            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
