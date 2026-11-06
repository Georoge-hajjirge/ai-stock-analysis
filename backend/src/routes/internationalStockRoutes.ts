
import { Router } from "express";

import {
    getInternationalStock,
    getInternationalHistory,
    getInternationalFundamentalsController,
    searchInternationalStocksController,
    getInternationalMarketOverviewController,
} from "../controllers/internationalStockController.js";

const router = Router();
router.get("/search", searchInternationalStocksController);

// Specific routes must come before the general symbol route.
router.get("/:symbol/history", getInternationalHistory);
router.get("/:symbol/fundamentals", getInternationalFundamentalsController);
router.get("/:symbol", getInternationalStock);
router.get("/market/:country", getInternationalMarketOverviewController);

export default router;
