
export interface ApiPagination {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface ShareholdingRecord {
    asOnDate: string | null;
    promoterPct: number | null;
    publicPct: number | null;
    employeeTrustPct: number | null;
    fiiPct: number | null;
    diiPct: number | null;
    mutualFundsPct: number | null;
    individualsPct: number | null;
    totalShares: number | null;
}

export interface MutualFundHolding {
    portfolioDate: string | null;
    fundHouse: string;
    schemeName: string;
    quantity: number | null;
    marketValueCr: number | null;
    percentageOfAum: number | null;
    quantityChange: number | null;
}

export interface InvestorTransaction {
    symbol: string | null;
    companyName: string | null;
    date: string | null;
    name: string;
    category: string | null;
    transactionType: string;
    quantity: number | null;
    price: number | null;
    value: number | null;
    sharesBeforePct: number | null;
    sharesAfterPct: number | null;
    mode: string | null;
    isPromoter: boolean | null;
    remarks: string | null;
}
export interface FiiDiiRecord {
    date: string | null;
    fiiBuyCr: number | null;
    fiiSellCr: number | null;
    fiiNetCr: number | null;
    diiBuyCr: number | null;
    diiSellCr: number | null;
    diiNetCr: number | null;
}

export interface InvestorPage<T> {
    symbol: string | null;
    transactions?: T[];
    holdings?: MutualFundHolding[];
    history?: ShareholdingRecord[];
    pagination?: ApiPagination;
}

export interface FiiDiiResponse {
    from: string | null;
    to: string | null;
    count: number;
    records: FiiDiiRecord[];
}
