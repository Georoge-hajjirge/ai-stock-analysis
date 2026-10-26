
import { Router } from "express";

import {
    marketBulkDealsController,
    marketBlockDealsController,
    marketInsiderTradesController,
    fiiDiiActivityController,
    getMutualFundPortfolios,
    getMutualFundHoldings,
} from "../controllers/investorIntelligenceController.js";

const router = Router();

router.get("/market/fii-dii", fiiDiiActivityController);
router.get("/market/bulk-deals", marketBulkDealsController);
router.get("/market/block-deals", marketBlockDealsController);
router.get("/market/insider-trades", marketInsiderTradesController);


router.get(
    "/mutual-funds/portfolios",
    getMutualFundPortfolios
);

router.get(
    "/mutual-funds/portfolios/:schemeName/holdings",
    getMutualFundHoldings
);
export default router;
