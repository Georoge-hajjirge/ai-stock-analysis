import { useState } from "react";
import FiiDiiActivity from "./FiiDiiActivity";
import MarketTransactions from "./MarketTransactions";
import MutualFundPortfolios from "./MutualFundPortfolios";

const tabs = [
    { id: "fii-dii", label: "FII / DII Activity" },
    { id: "bulk", label: "Bulk Deals" },
    { id: "block", label: "Block Deals" },
    { id: "insider", label: "Insider Trades" },
    { id: "mutual-funds", label: "Mutual Fund Portfolios" },

] as const;

type TabId = (typeof tabs)[number]["id"];

export default function MarketInvestorDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>("fii-dii");

    return (
        <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
            <header>
                <p className="text-sm font-medium text-blue-700">
                    INDIAN MARKET OVERVIEW
                </p>

                <h1 className="mt-1 text-2xl font-bold text-gray-900">
                    Investor Intelligence
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Explore institutional market flows, bulk and block deals,
                    and publicly disclosed insider transactions across companies.
                </p>
            </header>

            <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`shrink-0 rounded-t-lg px-4 py-3 text-sm font-medium transition ${activeTab === tab.id
                            ? "border-b-2 border-blue-600 bg-blue-50 text-blue-700"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "fii-dii" && <FiiDiiActivity />}
            {activeTab === "bulk" && <MarketTransactions kind="bulk" />}
            {activeTab === "block" && <MarketTransactions kind="block" />}
            {activeTab === "mutual-funds" && <MutualFundPortfolios />}
            {activeTab === "insider" && (
                <MarketTransactions kind="insider" />
            )}

            <p className="border-t border-gray-100 pt-3 text-xs leading-5 text-gray-500">
                Data depends on provider availability and published disclosures.
                Reported transactions do not necessarily explain why an investor
                bought or sold a security. Values and dates reflect the source
                data and may not be real-time.
            </p>
        </section>
    );
}
