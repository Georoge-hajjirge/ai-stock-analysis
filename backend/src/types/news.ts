
export type NewsCategory = "company" | "government" | "global";

export type NewsImportance = "high" | "normal";

export type NewsImpact =
    | "positive"
    | "negative"
    | "mixed"
    | "uncertain";

export interface NewsCandidate {
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    imageUrl?: string;
}

export interface NewsArticle extends NewsCandidate {
    category: NewsCategory;
    importance: NewsImportance;
    impact: NewsImpact;
    reason: string;
    relevanceScore: number;
}
