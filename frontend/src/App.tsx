
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import StockDetails from "./pages/StockDetails";
import StockComparison from "./pages/StockComparison";
import Watchlist from "./pages/Watchlist";
import InvestorIntelligencePage from "./pages/InvestorIntelligencePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/stock/:symbol" element={<StockDetails />} />
      <Route path="/compare" element={<StockComparison />} />
      <Route path="/watchlist" element={<Watchlist />} />

      <Route
        path="/investor-intelligence"
        element={<InvestorIntelligencePage />}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;
