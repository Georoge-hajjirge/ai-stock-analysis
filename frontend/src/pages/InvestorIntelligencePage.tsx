
import MarketInvestorDashboard from "../components/investor-intelligence/MarketInvestorDashboard";
import Header from "../components/Header";

export default function InvestorIntelligencePage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Header showBack />
            <main className="mx-auto max-w-7xl space-y-6 px-5 py-8 lg:px-8">
                <MarketInvestorDashboard />
            </main>
        </div>
    );
}
