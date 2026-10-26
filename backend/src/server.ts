import "dotenv/config";

import express from "express";
import cors from "cors";
import stockRoutes from "./routes/stockRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import investorIntelligenceRoutes from "./routes/investorIntelligenceRoutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        message: "AI Stock Backend is running",
    });
});

app.use("/api/stocks", stockRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/investor-intelligence", investorIntelligenceRoutes);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});