import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import type {
    HistoricalStockData,
    StockPeriod,
} from "../types/stock";

interface HistoricalChartProps {
    data: HistoricalStockData[];
    period: StockPeriod;
    onPeriodChange: (period: StockPeriod) => void;
    loading: boolean;
}

const periods: StockPeriod[] = ["1D", "1W", "1M", "6M", "1Y"];

function HistoricalChart({
    data,
    period,
    onPeriodChange,
    loading,
}: HistoricalChartProps) {
    const chartData = data
        .filter((item) => item.close !== undefined)
        .map((item) => ({
            ...item,
            displayDate: new Date(item.date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
            }),
        }));

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-950">
                            Historical Price
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Closing price over the selected period
                        </p>
                    </div>

                    <div className="flex rounded-xl bg-slate-100 p-1">
                        {periods.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => onPeriodChange(item)}
                                disabled={loading}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:px-4 ${period === item
                                        ? "bg-white text-slate-950 shadow-sm"
                                        : "text-slate-500 hover:text-slate-900"
                                    } ${loading
                                        ? "cursor-not-allowed opacity-50"
                                        : ""
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-5 sm:p-6">
                {loading ? (
                    <div className="flex h-[350px] items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                            <p className="mt-3 text-sm font-medium text-slate-500">
                                Loading historical data...
                            </p>
                        </div>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex h-[350px] items-center justify-center">
                        <p className="text-sm text-slate-500">
                            No historical data available
                        </p>
                    </div>
                ) : (
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: 0,
                                    bottom: 10,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="displayDate"
                                    tick={{
                                        fontSize: 11,
                                    }}
                                    tickLine={false}
                                    axisLine={false}
                                />

                                <YAxis
                                    domain={["auto", "auto"]}
                                    tick={{
                                        fontSize: 11,
                                    }}
                                    tickFormatter={(value) =>
                                        `₹${Number(value).toFixed(0)}`
                                    }
                                    tickLine={false}
                                    axisLine={false}
                                    width={60}
                                />

                                <Tooltip
                                    formatter={(value) => [
                                        `₹${Number(value).toFixed(2)}`,
                                        "Close",
                                    ]}
                                    labelFormatter={(label) =>
                                        `Date: ${label}`
                                    }
                                />

                                <Line
                                    type="monotone"
                                    dataKey="close"
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{
                                        r: 5,
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </section>
    );
}

export default HistoricalChart;