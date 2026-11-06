import { InvestmentScenario, ParsedInvestmentRequest } from "../types/investment.js";
import { StockData, HistoricalStockData } from "../types/stock.js";

const parseAmount = (question: string): number | undefined => {
    const normalized = question.replace(/,/g, "");

    const amountRegex =
        /(?:₹\s*|INR\s*)?(\d+(?:\.\d+)?)\s*(k|thousand|lakhs?|l)?\b/gi;

    for (const match of normalized.matchAll(amountRegex)) {
        const index = match.index ?? 0;
        const end = index + match[0].length;
        const remainingText = normalized.slice(end);

        // Do not interpret "1" in "1 month" as an investment amount.
        if (/^\s*(?:days?|weeks?|months?|years?)\b/i.test(remainingText)) {
            continue;
        }

        const value = Number(match[1]);
        const unit = match[2]?.toLowerCase();

        if (!Number.isFinite(value) || value <= 0) {
            continue;
        }

        const multiplier =
            unit === "k" || unit === "thousand"
                ? 1_000
                : unit === "l" || unit === "lakh" || unit === "lakhs"
                    ? 100_000
                    : 1;

        return value * multiplier;
    }

    return undefined;
};

const numberWords: Record<string, number> = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
};

export const parseInvestmentRequest = (
    question: string
): ParsedInvestmentRequest => {
    const amount = parseAmount(question);

    const durationMatch = question.match(
        /\b(?:after|for|in|within)\s+(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s*(days?|weeks?|months?|years?)\b/i
    ) ?? question.match(
        /\b(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s*(days?|weeks?|months?|years?)\b/i
    );

    if (!durationMatch) {
        return { amount };
    }

    const rawCount = durationMatch[1].toLowerCase();
    const count = numberWords[rawCount] ?? Number(rawCount);
    const unit = durationMatch[2].toLowerCase();

    if (!Number.isFinite(count) || count <= 0 || count > 3650) {
        return { amount };
    }

    let durationDays: number;

    if (unit.startsWith("day")) {
        durationDays = Math.round(count);
    } else if (unit.startsWith("week")) {
        durationDays = Math.round(count * 7);
    } else if (unit.startsWith("month")) {
        durationDays = Math.round(count * 30);
    } else {
        durationDays = Math.round(count * 365);
    }

    return {
        amount,
        durationDays,
        durationLabel: `${count} ${unit}`,
    };
};

export const calculateInvestmentScenarios = (
    stock: StockData,
    history: HistoricalStockData[],
    amount: number,
    durationDays: number,
    durationLabel: string
): InvestmentScenario => {
    const price = stock.price;

    if (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price <= 0
    ) {
        throw new Error("A valid current stock price is unavailable.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("A valid investment amount is required.");
    }

    const shares = Math.floor(amount / price);
    const investedAmount = shares * price;
    const remainingCash = amount - investedAmount;

    const result: InvestmentScenario = {
        investmentAmount: amount,
        holdingPeriod: durationLabel,
        tradingDays: Math.max(1, Math.round(durationDays * 5 / 7)),
        currentPrice: price,
        shares,
        remainingCash: Number(remainingCash.toFixed(2)),
        canPurchaseWholeShare: shares > 0,
        historicalObservations: 0,
    };

    if (shares === 0) {
        result.limitation =
            `₹${amount.toLocaleString("en-IN")} is below the current ` +
            `price of one share (₹${price.toFixed(2)}). ` +
            "A whole-share purchase is not possible with this amount.";

        return result;
    }

    const closes = history
        .map((item) => item.close)
        .filter(
            (close): close is number =>
                typeof close === "number" &&
                Number.isFinite(close) &&
                close > 0
        );

    const returns: number[] = [];

    for (let i = 1; i < closes.length; i++) {
        returns.push(closes[i] / closes[i - 1] - 1);
    }

    result.historicalObservations = returns.length;

    if (returns.length < 20) {
        result.limitation =
            "There is insufficient historical data to estimate scenarios reliably.";

        return result;
    }

    const meanDailyReturn =
        returns.reduce((sum, value) => sum + value, 0) / returns.length;

    const variance =
        returns.reduce(
            (sum, value) => sum + (value - meanDailyReturn) ** 2,
            0
        ) / (returns.length - 1);

    const dailyVolatility = Math.sqrt(variance);
    const horizon = result.tradingDays;

    const expectedReturn = meanDailyReturn * horizon;
    const uncertainty = dailyVolatility * Math.sqrt(horizon);

    const scenarioDefinitions = [
        {
            name: "Negative scenario",
            rate: expectedReturn - uncertainty,
        },
        {
            name: "Baseline scenario",
            rate: expectedReturn,
        },
        {
            name: "Positive scenario",
            rate: expectedReturn + uncertainty,
        },
    ];

    result.scenarios = scenarioDefinitions.map(({ name, rate }) => {
        const estimatedReturnPercent = Math.max(-100, rate * 100);

        // Apply the return to shares purchased, not uninvested cash.
        const estimatedProfitLoss =
            investedAmount * (estimatedReturnPercent / 100);

        // Preserve cash and add it to the estimated share value.
        const estimatedPortfolioValue = amount + estimatedProfitLoss;

        return {
            name,
            estimatedReturnPercent: Number(
                estimatedReturnPercent.toFixed(2)
            ),
            estimatedProfitLoss: Number(estimatedProfitLoss.toFixed(2)),
            estimatedPortfolioValue: Number(
                estimatedPortfolioValue.toFixed(2)
            ),
        };
    });

    result.limitation =
        "Scenarios use historical daily returns and volatility. " +
        "They are illustrative, not probabilities or guarantees. " +
        "Trading charges and taxes are excluded.";

    return result;
};
