import { Router } from "express";
import { getNewsController } from "../controllers/newsController.js";

const router = Router();

router.get("/:symbol", getNewsController);

export default router;