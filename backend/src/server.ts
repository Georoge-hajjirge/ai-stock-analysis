
import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import stockRoutes from "./routes/stockRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import investorIntelligenceRoutes from "./routes/investorIntelligenceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import favouritesRoutes from "./routes/favouritesRoutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        message: "AI Stock Backend is running",
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Protected favourites routes
app.use("/api/favourites", favouritesRoutes);

// Existing public APIs
app.use("/api/stocks", stockRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/investor-intelligence", investorIntelligenceRoutes);

async function startServer(): Promise<void> {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing from backend/.env");
    }

    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
});
