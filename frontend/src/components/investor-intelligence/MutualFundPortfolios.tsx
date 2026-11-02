
import { useCallback, useEffect, useState } from "react";
import {
    fetchMutualFundHoldings,
    fetchMutualFundPortfolios,
    type MutualFundHolding,
    type MutualFundHoldingsResponse,
    type MutualFundScheme,
} from "../../services/investorIntelligenceApi";
import { useNavigate } from "react-router-dom";

function formatNumber(value: number | null | undefined) {
    if (value == null || !Number.isFinite(value)) return "—";

    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(value);
}

function formatMonth(value: string | null | undefined) {
    if (!value) return "—";

    const date = new Date(value.length === 7 ? `${value}-01` : value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
        ...(value.length > 7 ? { day: "2-digit" } : {}),
    });
}

function formatQuantityChange(value: number | null | undefined) {
    if (value == null) return "—";

    return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}

function StatCard({
    label,
    value,
    description,
}: {
    label: string;
    value: string;
    description?: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 break-words text-xl font-semibold text-slate-900">
                {value}
            </p>
            {description && (
                <p className="mt-1 text-xs text-slate-500">{description}</p>
            )}
        </div>
    );
}

function QuantityChange({ value }: { value: number | null }) {
    if (value == null) {
        return <span className="text-slate-400">—</span>;
    }

    const color =
        value > 0
            ? "text-emerald-700"
            : value < 0
                ? "text-red-600"
                : "text-slate-500";

    return (
        <span className={`font-medium ${color}`}>
            {formatQuantityChange(value)}
        </span>
    );
}

export default function MutualFundPortfolios() {
    const [search, setSearch] = useState("");
    const [schemes, setSchemes] = useState<MutualFundScheme[]>([]);
    const [totalSchemes, setTotalSchemes] = useState(0);
    const [selectedScheme, setSelectedScheme] =
        useState<MutualFundScheme | null>(null);
    const [portfolio, setPortfolio] =
        useState<MutualFundHoldingsResponse | null>(null);
    const [page, setPage] = useState(1);

    const [schemesLoading, setSchemesLoading] = useState(true);
    const [holdingsLoading, setHoldingsLoading] = useState(false);
    const [schemesError, setSchemesError] = useState("");
    const [holdingsError, setHoldingsError] = useState("");

    const navigate = useNavigate();

    const handleHoldingClick = (symbol?: string | null) => {
        if (!symbol) return;

        const normalizedSymbol = symbol.trim().toUpperCase();

        // Add the NSE suffix when the symbol has no exchange suffix.
        const stockSymbol =
            normalizedSymbol.endsWith(".NS") ||
                normalizedSymbol.endsWith(".BO")
                ? normalizedSymbol
                : `${normalizedSymbol}.NS`;

        navigate(`/stock/${encodeURIComponent(stockSymbol)}`);
    };

    const loadSchemes = useCallback(async (query: string) => {
        setSchemesLoading(true);
        setSchemesError("");
        setHoldingsError("");
        setPortfolio(null);
        setSelectedScheme(null);

        try {
            const result = await fetchMutualFundPortfolios(query, "", 50, 0);
            setSchemes(result.portfolios ?? []);
            setTotalSchemes(result.total ?? result.count ?? 0);

            if (!result.portfolios?.length) {
                setSchemesError("No schemes found. Try another search.");
            }
        } catch (error) {
            setSchemes([]);
            setTotalSchemes(0);
            setSchemesError(
                error instanceof Error
                    ? error.message
                    : "Unable to load mutual fund schemes."
            );
        } finally {
            setSchemesLoading(false);
        }
    }, []);

    const loadHoldings = useCallback(
        async (scheme: MutualFundScheme, requestedPage: number) => {
            setSelectedScheme(scheme);
            setPage(requestedPage);
            setHoldingsLoading(true);
            setHoldingsError("");
            setPortfolio(null);

            try {
                const result = await fetchMutualFundHoldings(
                    scheme.schemeName,
                    requestedPage,
                    50
                );
                setPortfolio(result);
            } catch (error) {
                setHoldingsError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load portfolio holdings."
                );
            } finally {
                setHoldingsLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        void loadSchemes("");
    }, [loadSchemes]);

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void loadSchemes(search.trim());
    };

    const holdings: MutualFundHolding[] = portfolio?.holdings ?? [];
    const pagination = portfolio?.pagination;

    return (
        <section className="space-y-6">
            <div>
                <p className="text-sm font-medium text-blue-700">
                    MUTUAL FUND RESEARCH
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                    Scheme Portfolio Explorer
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Explore reported mutual fund holdings, portfolio
                    allocation, market values, and changes in share quantities.
                    Data reflects the reporting period supplied by the provider.
                </p>
            </div>

            <form
                onSubmit={handleSearch}
                className="flex flex-col gap-3 sm:flex-row"
            >
                <div className="relative flex-1">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search schemes, e.g. HDFC Flexi Cap Fund"
                        aria-label="Search mutual fund schemes"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
                <button
                    type="submit"
                    disabled={schemesLoading}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {schemesLoading ? "Searching..." : "Search schemes"}
                </button>
            </form>

            {schemesError && (
                <div
                    role="alert"
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
                >
                    {schemesError}
                </div>
            )}

            {!schemesLoading && schemes.length > 0 && (
                <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,2fr)]">
                    <aside className="min-w-0 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-slate-900">
                                Mutual fund schemes
                            </h3>
                            <span className="text-xs text-slate-500">
                                {schemes.length} shown
                                {totalSchemes > 0
                                    ? ` of ${formatNumber(totalSchemes)}`
                                    : ""}
                            </span>
                        </div>

                        <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                            {schemes.map((scheme) => {
                                const selected =
                                    selectedScheme?.schemeName ===
                                    scheme.schemeName;

                                return (
                                    <button
                                        key={`${scheme.fundHouse}-${scheme.schemeName}`}
                                        type="button"
                                        onClick={() =>
                                            void loadHoldings(scheme, 1)
                                        }
                                        className={`w-full rounded-xl border p-3 text-left transition ${selected
                                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-100"
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                    >
                                        <span className="block text-sm font-semibold leading-5 text-slate-900">
                                            {scheme.schemeName}
                                        </span>
                                        <span className="mt-1 block text-xs text-slate-500">
                                            {scheme.fundHouse || "Fund house unavailable"}
                                        </span>
                                        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                            <span>
                                                Report: {formatMonth(scheme.latestMonth)}
                                            </span>
                                            <span>
                                                {formatNumber(scheme.holdingCount)} holdings
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {schemes.length < totalSchemes && (
                            <p className="text-xs leading-5 text-slate-500">
                                Showing the first {schemes.length} schemes.
                                Refine your search to find a specific scheme.
                            </p>
                        )}
                    </aside>

                    <div className="min-w-0 space-y-4">
                        {!selectedScheme && !holdingsLoading && (
                            <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <div>
                                    <h3 className="font-semibold text-slate-800">
                                        Select a mutual fund scheme
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Choose a scheme from the list to view
                                        its reported portfolio.
                                    </p>
                                </div>
                            </div>
                        )}

                        {holdingsLoading && (
                            <div
                                role="status"
                                className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600"
                            >
                                Loading portfolio holdings...
                            </div>
                        )}

                        {holdingsError && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                            >
                                {holdingsError}
                            </div>
                        )}

                        {portfolio && !holdingsLoading && (
                            <>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {portfolio.schemeName}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {portfolio.fundHouse}
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    <StatCard
                                        label="Portfolio reporting date"
                                        value={formatMonth(portfolio.portfolioDate)}
                                        description="Source-reported date"
                                    />
                                    <StatCard
                                        label="Reported holdings"
                                        value={formatNumber(
                                            pagination?.totalItems ??
                                            holdings.length
                                        )}
                                    />
                                    <StatCard
                                        label="Portfolio coverage"
                                        value={
                                            portfolio.coveragePct == null
                                                ? "—"
                                                : `${formatNumber(portfolio.coveragePct)}%`
                                        }
                                        description="As reported by the provider"
                                    />
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <h4 className="font-semibold text-slate-900">
                                            Portfolio holdings
                                        </h4>
                                        <span className="text-xs text-slate-500">
                                            Market value in ₹ crore · Allocation as % of AUM
                                        </span>
                                    </div>

                                    {holdings.length === 0 ? (
                                        <p className="p-6 text-sm text-slate-500">
                                            No holdings were returned for this page.
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[760px] text-left text-sm">
                                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold">
                                                            Company / Instrument
                                                        </th>
                                                        <th className="px-4 py-3 text-right font-semibold">
                                                            Allocation
                                                        </th>
                                                        <th className="px-4 py-3 text-right font-semibold">
                                                            Market value (₹ Cr)
                                                        </th>
                                                        <th className="px-4 py-3 text-right font-semibold">
                                                            Quantity
                                                        </th>
                                                        <th className="px-4 py-3 text-right font-semibold">
                                                            Quantity change
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {holdings.map((holding, index) => (
                                                        <tr
                                                            key={`${holding.isin ?? holding.symbol ?? holding.companyName ?? "holding"}-${index}`}
                                                            onClick={() => handleHoldingClick(holding.symbol)}
                                                            className={`transition-colors ${holding.symbol
                                                                ? "cursor-pointer hover:bg-blue-50"
                                                                : "hover:bg-slate-50"
                                                                }`}
                                                            title={holding.symbol ? "View stock details" : undefined}
                                                        >
                                                            <td className="px-4 py-3">
                                                                <span className="block font-medium text-slate-900">
                                                                    {holding.companyName ||
                                                                        holding.symbol ||
                                                                        holding.instrumentType ||
                                                                        "Unnamed instrument"}
                                                                </span>
                                                                <span className="mt-1 block text-xs text-slate-500">
                                                                    {holding.symbol
                                                                        ? holding.symbol
                                                                        : holding.instrumentType || "Instrument"}
                                                                    {holding.isin
                                                                        ? ` · ${holding.isin}`
                                                                        : ""}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                                {holding.percentageOfAum == null
                                                                    ? "—"
                                                                    : `${formatNumber(holding.percentageOfAum)}%`}
                                                            </td>
                                                            <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                                                                {formatNumber(holding.marketValueCr)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                                                                {formatNumber(holding.quantity)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right tabular-nums">
                                                                <QuantityChange
                                                                    value={holding.quantityChange}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs text-slate-500">
                                            {pagination
                                                ? `Page ${pagination.page} of ${pagination.totalPages} · ${formatNumber(pagination.totalItems)} holdings`
                                                : `${holdings.length} holdings`}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={
                                                    holdingsLoading ||
                                                    !pagination ||
                                                    pagination.page <= 1
                                                }
                                                onClick={() =>
                                                    selectedScheme &&
                                                    void loadHoldings(
                                                        selectedScheme,
                                                        page - 1
                                                    )
                                                }
                                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                type="button"
                                                disabled={
                                                    holdingsLoading ||
                                                    !pagination ||
                                                    pagination.page >=
                                                    pagination.totalPages
                                                }
                                                onClick={() =>
                                                    selectedScheme &&
                                                    void loadHoldings(
                                                        selectedScheme,
                                                        page + 1
                                                    )
                                                }
                                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <p className="border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                Portfolio holdings represent reported positions for the displayed
                reporting period. A positive quantity change indicates an increase,
                a negative value indicates a decrease, and zero indicates no reported
                change. These figures do not by themselves establish the fund
                manager&apos;s intent or predict future returns.
            </p>
        </section>
    );
}
