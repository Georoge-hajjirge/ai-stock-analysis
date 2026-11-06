
import { Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import StockDetails from "./pages/StockDetails";
import StockComparison from "./pages/StockComparison";
import Watchlist from "./pages/Watchlist";
import InvestorIntelligencePage from "./pages/InvestorIntelligencePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalMarketPage from "./pages/GlobalMarketPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/stock/:symbol" element={<StockDetails />} />
      <Route path="/compare" element={<StockComparison />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/watchlist"
        element={
          <ProtectedRoute>
            <Watchlist />
          </ProtectedRoute>
        }
      />

      <Route
        path="/investor-intelligence"
        element={<InvestorIntelligencePage />}
      />
      <Route
        path="/global-market/:country"
        element={<GlobalMarketPage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
