import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
    getFavourites,
    addFavourite,
    removeFavourite,
} from "../controllers/favouritesController.js";

const router = Router();

router.use(requireAuth);
router.get("/", getFavourites);
router.post("/", addFavourite);
router.delete("/:symbol", removeFavourite);

export default router;