
import { useEffect, useState } from "react";
import { fetchFiiDiiActivity } from "../../services/investorIntelligenceApi";
import type {
    FiiDiiRecord,
    FiiDiiResponse,
} from "../../types/investorIntelligence";

const formatCr = (value: number | null | undefined) =>
    value == null
        ? "N/A"
        : `₹${new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2,
        }).format(value)} Cr`;

function NetValue({ value }: { value: number | null }) {
    if (value == null) return <>N/A</>;

    return (
        <span
            className={
                value > 0
                    ? "font-medium text-green-700"
                    : value < 0
                        ? "font-medium text-red-700"
                        : "text-gray-600"
            }
        >
            {value > 0 ? "+" : ""}
            {formatCr(value)}
        </span>
    );
}

export default function FiiDiiActivity() {
    const [result, setResult] = useState<FiiDiiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        fetchFiiDiiActivity()
            .then((data) => {
                if (active) setResult(data);
            })
            .catch((err: unknown) => {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load FII/DII activity."
                    );
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const records: FiiDiiRecord[] = result?.records ?? [];

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">
                    FII / DII market activity
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Daily institutional buying, selling and net flows across
                    the market. Values are in ₹ crores.
                </p>
            </div>

            {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {loading ? (
                <p className="text-sm text-gray-500">
                    Loading market activity...
                </p>
            ) : !error && records.length === 0 ? (
                <p className="text-sm text-gray-500">
                    No market activity records available.
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-sm text-gray-500">
                                Latest FII net flow
                            </p>
                            <p className="mt-2 text-xl font-semibold">
                                <NetValue value={records[0]?.fiiNetCr ?? null} />
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {records[0]?.date ?? ""}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-sm text-gray-500">
                                Latest DII net flow
                            </p>
                            <p className="mt-2 text-xl font-semibold">
                                <NetValue value={records[0]?.diiNetCr ?? null} />
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {records[0]?.date ?? ""}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">FII buy</th>
                                    <th className="p-3">FII sell</th>
                                    <th className="p-3">FII net</th>
                                    <th className="p-3">DII buy</th>
                                    <th className="p-3">DII sell</th>
                                    <th className="p-3">DII net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record, index) => (
                                    <tr
                                        key={`${record.date}-${index}`}
                                        className="border-t border-gray-100"
                                    >
                                        <td className="p-3">
                                            {record.date ?? "N/A"}
                                        </td>
                                        <td className="p-3">
                                            {formatCr(record.fiiBuyCr)}
                                        </td>
                                        <td className="p-3">
                                            {formatCr(record.fiiSellCr)}
                                        </td>
                                        <td className="p-3">
                                            <NetValue value={record.fiiNetCr} />
                                        </td>
                                        <td className="p-3">
                                            {formatCr(record.diiBuyCr)}
                                        </td>
                                        <td className="p-3">
                                            {formatCr(record.diiSellCr)}
                                        </td>
                                        <td className="p-3">
                                            <NetValue value={record.diiNetCr} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    );
}
