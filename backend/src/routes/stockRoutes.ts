import { Router } from "express";
import {
    searchStockController,
    getStockController,
    getHistoricalStockController,
    getFundamentalsController,
    getAIStockAnalysisController,
    getAIStockQuestionController,
} from "../controllers/stockController.js";
import { compareStocksController } from "../controllers/stockComparisonController.js";
import { getPositiveStocksController } from "../controllers/marketInsightsController.js";

const router = Router();

router.get("/search", searchStockController);
router.get("/insights/positive", getPositiveStocksController);
router.get("/:symbol/history", getHistoricalStockController);
router.get("/:symbol", getStockController);
router.get(
    "/:symbol/fundamentals",
    getFundamentalsController
);
router.get(
    "/:symbol/ai-analysis",
    getAIStockAnalysisController
);
router.post(
    "/:symbol/ai-question",
    getAIStockQuestionController
);

router.post("/compare", compareStocksController);

export default router;
