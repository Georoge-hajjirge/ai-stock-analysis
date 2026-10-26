import type { PriceAlert, WatchlistItem } from "../types/stock";

const WATCHLIST_KEY = "ai-stock-watchlist";
const PRICE_ALERTS_KEY = "ai-stock-price-alerts";

// Watchlist operations
export const getWatchlist = (): WatchlistItem[] => {
    try {
        return JSON.parse(
            localStorage.getItem(WATCHLIST_KEY) || "[]"
        ) as WatchlistItem[];
    } catch {
        return [];
    }
};

export const addToWatchlist = (
    stock: Omit<WatchlistItem, "addedAt">
): WatchlistItem[] => {
    const watchlist = getWatchlist();

    if (watchlist.some((item) => item.symbol === stock.symbol)) {
        return watchlist;
    }

    const updatedWatchlist: WatchlistItem[] = [
        ...watchlist,
        {
            ...stock,
            addedAt: Date.now(),
        },
    ];

    localStorage.setItem(
        WATCHLIST_KEY,
        JSON.stringify(updatedWatchlist)
    );

    return updatedWatchlist;
};

export const removeFromWatchlist = (
    symbol: string
): WatchlistItem[] => {
    const updatedWatchlist = getWatchlist().filter(
        (item) => item.symbol !== symbol
    );

    localStorage.setItem(
        WATCHLIST_KEY,
        JSON.stringify(updatedWatchlist)
    );

    return updatedWatchlist;
};

// Price alert operations
export const getPriceAlerts = (): PriceAlert[] => {
    try {
        return JSON.parse(
            localStorage.getItem(PRICE_ALERTS_KEY) || "[]"
        ) as PriceAlert[];
    } catch {
        return [];
    }
};

export const addPriceAlert = (
    alert: Omit<
        PriceAlert,
        "id" | "createdAt" | "isTriggered" | "triggeredAt"
    >
): PriceAlert[] => {
    const alerts = getPriceAlerts();

    const newAlert: PriceAlert = {
        ...alert,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        isTriggered: false,
    };

    const updatedAlerts = [...alerts, newAlert];

    localStorage.setItem(
        PRICE_ALERTS_KEY,
        JSON.stringify(updatedAlerts)
    );

    return updatedAlerts;
};

export const removePriceAlert = (id: string): PriceAlert[] => {
    const updatedAlerts = getPriceAlerts().filter(
        (alert) => alert.id !== id
    );

    localStorage.setItem(
        PRICE_ALERTS_KEY,
        JSON.stringify(updatedAlerts)
    );

    return updatedAlerts;
};

export const updatePriceAlert = (
    updatedAlert: PriceAlert
): PriceAlert[] => {
    const updatedAlerts = getPriceAlerts().map((alert) =>
        alert.id === updatedAlert.id ? updatedAlert : alert
    );

    localStorage.setItem(
        PRICE_ALERTS_KEY,
        JSON.stringify(updatedAlerts)
    );

    return updatedAlerts;
};
