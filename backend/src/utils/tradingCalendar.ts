const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MARKET_OPEN_MINUTES = 9 * 60 + 15;

// NSE trading holidays as "YYYY-MM-DD". Fill these in from NSE's published
// holiday list; weekends are already handled.
const HOLIDAYS = new Set<string>([]);

const toISTParts = (date: Date) => {
    const ist = new Date(date.getTime() + IST_OFFSET_MS);

    return {
        dateKey: ist.toISOString().slice(0, 10),
        minutes: ist.getUTCHours() * 60 + ist.getUTCMinutes(),
    };
};

const addDays = (dateKey: string, days: number): string => {
    const date = new Date(`${dateKey}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
};

export const getTargetSession = (now = new Date()) => {
    const { dateKey, minutes } = toISTParts(now);

    let candidate = dateKey;

    // Before today's open on a trading day, the target is today.
    if (!(isTradingDay(candidate) && minutes < MARKET_OPEN_MINUTES)) {
        candidate = addDays(candidate, 1);
    }

    while (!isTradingDay(candidate)) {
        candidate = addDays(candidate, 1);
    }

    const label = new Date(`${candidate}T00:00:00Z`).toLocaleDateString(
        "en-IN",
        { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }
    );

    return { date: candidate, label };
};

export const formatIST = (date = new Date()): string =>
    date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

export const isTradingDay = (dateKey: string): boolean => {
    const day = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
    return day !== 0 && day !== 6 && !HOLIDAYS.has(dateKey);
};

export const todayISTKey = (now = new Date()): string => toISTParts(now).dateKey;