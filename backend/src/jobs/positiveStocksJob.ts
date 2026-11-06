import cron from "node-cron";
import {
    refreshPositiveStocks,
    warmPositiveStocks,
} from "../services/positiveStocksService.js";
import { isTradingDay, todayISTKey } from "../utils/tradingCalendar.js";

const run = async (label: string) => {
    if (!isTradingDay(todayISTKey())) {
        console.log(`[positive-stocks] ${label}: not a trading day, skipped`);
        return;
    }

    try {
        await refreshPositiveStocks();
        console.log(`[positive-stocks] ${label}: snapshot updated`);
    } catch (error) {
        console.error(`[positive-stocks] ${label} failed:`, error);
    }
};

export const startPositiveStocksJob = () => {
    // Before pre-open (09:00), and after the 15:30 close.
    cron.schedule("30 8 * * 1-5", () => void run("pre-open"), {
        timezone: "Asia/Kolkata",
    });
    cron.schedule("0 16 * * 1-5", () => void run("post-close"), {
        timezone: "Asia/Kolkata",
    });

    warmPositiveStocks().catch((error) =>
        console.error("[positive-stocks] startup refresh failed:", error)
    );
};