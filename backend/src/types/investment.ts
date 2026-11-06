export interface InvestmentScenario {
    investmentAmount: number;
    holdingPeriod: string;
    tradingDays: number;
    currentPrice: number;
    shares: number;
    remainingCash: number;
    canPurchaseWholeShare: boolean;
    historicalObservations: number;
    scenarios?: {
        name: string;
        estimatedReturnPercent: number;
        estimatedProfitLoss: number;
        estimatedPortfolioValue: number;
    }[];
    limitation?: string;
}

export interface ParsedInvestmentRequest {
    amount?: number;
    durationDays?: number;
    durationLabel?: string;
}