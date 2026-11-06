
import { GoogleGenAI } from "@google/genai";

import { AIStockComparisonItem, AIStockQuestionInput, AnalyzeStockNewsInput, PositiveStockPick, PositiveStocksContext } from "../types/ai.js";
import { NewsCandidate, NewsArticle, NewsCategory } from "../types/news.js";
import { StockData, StockFundamentals, HistoricalStockData } from "../types/stock.js";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({ apiKey });

export const analyzeStockNews = async (
    input: AnalyzeStockNewsInput
): Promise<NewsArticle[]> => {
    if (input.articles.length === 0) {
        return [];
    }

    const articlesForAI = input.articles.map((article, id) => ({
        id,
        title: article.title,
        description: article.description,
        source: article.source,
        publishedAt: article.publishedAt,
    }));

    const prompt = `
You are a financial news analyst evaluating news for one specific stock.

Stock symbol: ${input.symbol}
Company name: ${input.companyName}

Analyze the supplied articles and return ONLY valid JSON in this format:
{
  "articles": [
    {
      "id": 0,
      "category": "company",
      "importance": "high",
      "impact": "positive",
      "reason": "Short explanation of the article's relevance to this stock.",
      "relevanceScore": 90
    }
  ]
}

Rules:

1. Only return articles that have a meaningful, explainable connection
   to ${input.companyName} (${input.symbol}) or could reasonably affect
   this specific stock.
2. Exclude unrelated articles, even if they mention the economy, markets,
   government, or another company.
3. Category must be exactly one of:
   - "company": company-specific results, contracts, management,
     operations, products, competitors, or business developments.
   - "government": government policy, RBI, SEBI, taxation, legislation,
     or regulatory actions relevant to this stock.
   - "global": international markets, global economic conditions,
     geopolitical events, commodities, or overseas developments
     that could affect this stock.
4. Importance must be "high" or "normal".
   Use "high" only when the article could materially affect the company,
   its valuation, operations, financial results, or stock price.
   Do not classify news as high merely because it sounds dramatic.
5. Impact must be "positive", "negative", "mixed", or "uncertain".
   Assess the likely impact on this specific stock, not the general
   tone of the article. Use "uncertain" when evidence is insufficient.
6. The reason must briefly explain the connection to this stock.
   Do not invent facts or claim an impact that the article does not support.
7. relevanceScore must be an integer from 0 to 100:
   90-100: directly and strongly relevant;
   75-89: clearly relevant;
   60-74: plausible and explainable relevance;
   below 60: weak or unrelated.
8. Return only articles with relevanceScore >= 60.
9. Use each article's original id exactly. Never invent an article or id.
10. If an article's connection to this stock is unclear, exclude it.
11. Return an empty articles array if none qualify.
12. Do not provide investment advice or buy/sell recommendations.

Articles:
${JSON.stringify(articlesForAI)}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            maxOutputTokens: 6000,
        },
    });

    const responseText = response.text?.trim();

    if (!responseText) {
        console.error("Gemini returned an empty news analysis response.");
        return [];
    }

    let parsed: {
        articles?: Array<{
            id?: number;
            category?: string;
            importance?: string;
            impact?: string;
            reason?: string;
            relevanceScore?: number;
        }>;
    };

    try {
        parsed = JSON.parse(responseText);
    } catch (error) {
        console.error("Failed to parse Gemini news analysis JSON.", {
            error,
            responseLength: responseText.length,
            responsePreview: responseText.slice(0, 500),
            responseEnding: responseText.slice(-300),
        });

        throw new Error(
            "Gemini returned incomplete or invalid JSON for stock news analysis."
        );
    }

    if (!Array.isArray(parsed.articles)) {
        console.error("Gemini response does not contain an articles array.");
        return [];
    }

    const validCategories = new Set([
        "company",
        "government",
        "global",
    ]);

    const validImportance = new Set(["high", "normal"]);

    const validImpacts = new Set([
        "positive",
        "negative",
        "mixed",
        "uncertain",
    ]);

    const analyzed: NewsArticle[] = [];

    for (const item of parsed.articles) {
        if (
            typeof item.id !== "number" ||
            !Number.isInteger(item.id) ||
            item.id < 0 ||
            item.id >= input.articles.length
        ) {
            continue;
        }

        if (
            !validCategories.has(item.category ?? "") ||
            !validImportance.has(item.importance ?? "") ||
            !validImpacts.has(item.impact ?? "") ||
            typeof item.reason !== "string" ||
            !item.reason.trim() ||
            typeof item.relevanceScore !== "number" ||
            !Number.isFinite(item.relevanceScore) ||
            item.relevanceScore < 60 ||
            item.relevanceScore > 100
        ) {
            continue;
        }

        const originalArticle = input.articles[item.id];

        analyzed.push({
            ...originalArticle,
            category: item.category as NewsArticle["category"],
            importance: item.importance as NewsArticle["importance"],
            impact: item.impact as NewsArticle["impact"],
            reason: item.reason.trim(),
            relevanceScore: Math.round(item.relevanceScore),
        });
    }

    // Prevent duplicate IDs in Gemini's response from duplicating articles.
    return Array.from(
        new Map(analyzed.map((article) => [article.url, article])).values()
    );
};


interface AIStockAnalysisInput {
    stock: StockData;
    fundamentals: StockFundamentals | null;
    historicalData: HistoricalStockData[];
    news: NewsArticle[];
}

export const generateStockAnalysis = async (
    input: AIStockAnalysisInput
): Promise<string> => {
    const prompt = `
You are a financial analysis assistant for Indian stocks.

Analyze the following data.

Stock:
${JSON.stringify(input.stock, null, 2)}

Fundamentals:
${JSON.stringify(input.fundamentals, null, 2)}

Historical Price Data:
${JSON.stringify(input.historicalData, null, 2)}

Latest News:
${JSON.stringify(input.news, null, 2)}

Provide these sections:
1. Overall Summary
2. Performance
3. Historical Trend
4. Growth
5. Valuation
6. Positive Factors
7. Risks
8. Conclusion

Rules:
- Use only the supplied data.
- Do not invent prices, financial values, events, or news.
- Identify whether the historical trend generally increased,
  decreased, or moved sideways.
- Mention highs and lows only when supported by the data.
- Clearly identify unavailable information.
- Do not describe delayed data as real-time data.
- This is informational analysis, not financial advice.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt,
        });

        return response.text ?? "No analysis generated.";
    } catch (error: unknown) {
        console.error("Gemini AI error:", error);
        throw new Error("Failed to generate AI stock analysis");
    }
};




export const generateStockComparison = async (
    stocks: AIStockComparisonItem[]
): Promise<string> => {
    // Keep only the earliest and latest valid closing prices for a compact
    // historical performance summary.
    const comparisonData = stocks.map((item) => {
        const validHistory = item.history
            .filter(
                (record) =>
                    Number.isFinite(record.close) &&
                    typeof record.close === "number" &&
                    record.close > 0
            )
            .sort((a, b) => a.timestamp - b.timestamp);

        const first = validHistory[0];
        const latest = validHistory[validHistory.length - 1];


        const historicalChangePercent =
            typeof first?.close === "number" &&
                Number.isFinite(first.close) &&
                typeof latest?.close === "number" &&
                Number.isFinite(latest.close) &&
                first.close > 0
                ? Number(
                    (
                        ((latest.close - first.close) / first.close) *
                        100
                    ).toFixed(2)
                )
                : null;

        return {
            symbol: item.symbol,
            stock: item.stock,
            fundamentals: item.fundamentals,
            historicalPerformance: {
                earliestDate: first?.date ?? null,
                earliestClose: first?.close ?? null,
                latestDate: latest?.date ?? null,
                latestClose: latest?.close ?? null,
                changePercent: historicalChangePercent,
                observations: validHistory.length,
            },
            news: item.news.slice(0, 2).map((article) => ({
                title: article.title,
                source: article.source,
                publishedAt: article.publishedAt,
                url: article.url,
                description: article.description?.slice(0, 250),
            })),
        };
    });

    const prompt = `
Compare these ${stocks.length} Indian stocks using only the supplied data.

DATA:
${JSON.stringify(comparisonData)}

Return a concise Markdown report with these sections:
1. Executive Summary
2. Current Performance
3. Historical Performance
4. Fundamentals and Valuation
5. Relevant News and Risks
6. Overall Comparison

Requirements:
- Maximum 700 words.
- Use a compact comparison table where useful.
- Mention current price, daily change, market cap, P/E, ROE and dividend yield only when available.
- Explain the supplied historical percentage change and dates.
- Do not invent or assume missing values.
- Do not treat a lower P/E as automatically undervalued.
- Include at most two supplied news articles per stock, with original clickable URLs.
- Clearly distinguish facts from interpretations.
- Do not provide personalized buy, sell, or hold recommendations.
- State that the analysis is informational, not financial advice.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt,
            config: {
                maxOutputTokens: 1200,
            },
        });

        return response.text ?? "No stock comparison generated.";
    } catch (error: unknown) {
        console.error("Gemini stock comparison error:", error);
        throw new Error("Failed to generate AI stock comparison");
    }
};


export const generateStockQuestionAnswer = async (
    input: AIStockQuestionInput
): Promise<string> => {
    const amount = input.investmentRequest?.amount;
    const durationDays = input.investmentRequest?.durationDays;
    const durationLabel = input.investmentRequest?.durationLabel;

    const isCompleteInvestmentRequest =
        amount !== undefined &&
        durationDays !== undefined &&
        Boolean(durationLabel);

    const isInvestmentRequest =
        isCompleteInvestmentRequest ||
        /\b(invest|investment|investing|invested|profit|returns?|earnings from investment)\b/i.test(
            input.question
        );

    // Identify questions specifically asking about price movements.
    const isPriceMovementQuestion =
        /\b(why|reason|reasons|cause|causes|explain|what happened)\b/i.test(
            input.question
        ) &&
        /\b(fall|falls|falling|fell|drop|drops|dropped|dropping|decline|declines|declining|down|rise|rises|rising|rose|gain|gains|gaining|surge|surges|surging|increase|increases|increasing|movement|moving|crash|crashing|jump|jumping)\b/i.test(
            input.question
        );

    // News is included only for completed investment analyses
    // or questions asking why a stock price is moving.
    const shouldIncludeNews =
        isCompleteInvestmentRequest || isPriceMovementQuestion;

    const relevantNews = shouldIncludeNews
        ? input.news.slice(0, 10)
        : [];

    // Ask for missing investment details without generating an AI response.
    if (isInvestmentRequest) {
        if (amount === undefined) {
            return "How much would you like to invest?";
        }

        if (
            durationDays === undefined ||
            !durationLabel
        ) {
            return "How long do you plan to hold the investment?";
        }

        if (!input.investmentScenario) {
            return (
                "I couldn't calculate the investment scenarios because " +
                "the required stock price or historical data is unavailable. " +
                "Please try again when the data is available."
            );
        }

        if (
            input.investmentScenario.limitation &&
            !input.investmentScenario.scenarios?.length
        ) {
            return (
                `Investment amount: ₹${input.investmentScenario.investmentAmount.toLocaleString("en-IN")}\n` +
                `Holding period: ${input.investmentScenario.holdingPeriod}\n\n` +
                `${input.investmentScenario.limitation}`
            );
        }
    }

    const newsInstructions = shouldIncludeNews
        ? `
NEWS RESPONSE RULES:
1. Include a section titled "Relevant News and Possible Impact".
2. Select the most relevant articles from the supplied news.
3. For each article, include its exact headline, source, and publication
   date when available.
4. Include a clickable Markdown link using the original article URL:
   [Read article](original_url)
5. Never invent, modify, or guess article URLs.
6. Explain how an article may relate to the stock's movement or investment
   outlook, but do not claim it caused a price movement without evidence.
7. Include relevant positive and negative developments where available.
8. If no relevant articles are available, say that no relevant news was found.
`
        : `
NEWS RESPONSE RULES:
1. Do not include news, news headlines, news links, or a news section.
2. Answer the user's question directly using the relevant stock data.
`;

    const investmentInstructions = isCompleteInvestmentRequest
        ? `
INVESTMENT RESPONSE RULES:
1. Use the supplied calculated scenarios exactly. Do not recalculate or
   invent financial values.
2. Explain the negative, baseline, and positive scenarios clearly.
3. Explain that these are estimates based on historical returns and
   volatility, not predictions or guarantees.
4. Include the relevant news section after the investment scenarios.
5. Keep the response concise and easy to understand.
`
        : `
GENERAL RESPONSE RULES:
1. Answer the user's question directly and concisely.
2. For questions about price movements, explain what the supplied price
   history and relevant news can support.
3. For general questions, such as "What is the P/E ratio?", explain the
   requested concept without adding unrelated sections.
`;

    const prompt = `
You are an AI stock analysis assistant for Indian stocks.

Answer the user's question using only the supplied information.

STOCK DATA:
${JSON.stringify(input.stock, null, 2)}

FUNDAMENTALS:
${JSON.stringify(input.fundamentals, null, 2)}

HISTORICAL DATA:
${JSON.stringify(input.historicalData, null, 2)}

RELEVANT NEWS:
${JSON.stringify(relevantNews, null, 2)}

INVESTMENT REQUEST:
${JSON.stringify(
        isCompleteInvestmentRequest ? input.investmentRequest : null,
        null,
        2
    )}

CALCULATED INVESTMENT SCENARIOS:
${JSON.stringify(
        isCompleteInvestmentRequest ? input.investmentScenario : null,
        null,
        2
    )}

USER QUESTION:
${input.question}

GENERAL RULES:
1. Use only the supplied data. Never invent stock prices, financial values,
   company facts, or news.
2. Distinguish confirmed facts from possible explanations.
3. Do not give personalized buy, sell, or hold recommendations.
4. Do not claim that news caused a price movement unless the supplied
   evidence supports that connection.
5. Do not repeat information unnecessarily.
6. Never present estimated returns as guaranteed results.

${investmentInstructions}

${newsInstructions}

For investment calculations, use this structure:

Investment Summary
- Current stock price
- Investment amount and holding period
- Number of whole shares and remaining cash

Investment Scenarios
- Negative: estimated return, profit/loss, portfolio value
- Baseline: estimated return, profit/loss, portfolio value
- Positive: estimated return, profit/loss, portfolio value

Relevant News and Possible Impact
- Relevant article headlines with clickable original links
- Brief explanations of potential positive or negative implications

Disclaimer
One brief sentence explaining that estimates are uncertain and exclude
trading charges and taxes.

For stock-movement questions, answer the question first, then show relevant
news links and explain what the available evidence suggests.

For other questions, provide only the information needed to answer them.

Only include sections relevant to the user's question.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        return response.text ?? "No answer generated.";
    } catch (error: unknown) {
        console.error("Gemini AI question error:", error);
        throw new Error("Failed to answer stock question");
    }
};

export const identifyPositiveStocks = async (
    articles: NewsCandidate[],
    context: PositiveStocksContext
): Promise<PositiveStockPick[]> => {
    if (articles.length === 0) {
        return [];
    }

    const articlesForAI = articles.map((article, id) => ({
        id,
        title: article.title,
        description: article.description?.slice(0, 300),
        source: article.source,
        publishedAt: article.publishedAt,
    }));

    const prompt = `
You are a financial news analyst for Indian stocks.

Current time (IST): ${context.currentTimeIST}
Target trading session: ${context.targetSession}
NSE trades 09:15-15:30 IST. Article publishedAt values are in UTC
(IST = UTC + 5:30).

From the supplied articles, identify NSE-listed companies for which the news
gives a clear reason to expect a POSITIVE price reaction in the target
session. Return ONLY valid JSON:
{
  "picks": [
    {
      "companyName": "Tata Consultancy Services",
      "nseTicker": "TCS",
      "sector": "IT",
      "category": "company",
      "confidence": 85,
      "reason": "Large deal win may lift sentiment.",
      "articleIds": [0, 4]
    }
  ]
}

Rules:
1. Only include companies listed on NSE. companyName must be the official name.
2. nseTicker is the NSE ticker without any suffix. Use an empty string if you
   are not confident of it. Never guess.
3. Include a company only when at least one article gives a clear, explainable
   reason for a positive impact. Exclude negative, mixed or unclear cases.
4. Category must be exactly one of:
   - "company": company-specific results, orders, contracts, upgrades or management news.
   - "government": policy, RBI, SEBI, tax or regulatory news.
   - "global": international markets, commodities, currency or overseas events.
5. Government and global news may support companies in the affected sector
   (for example, lower crude oil prices for paints or aviation), but the
   reason must state that connection and an article must support it.
6. For "company" picks, the company must be named in the cited articles.
7. Timing matters. News published after the last market close or before the
   target session opens is likely not yet reflected in the price, so it
   deserves higher confidence. News published well before the last close is
   probably already priced in: cap its confidence at 70.
8. confidence is an integer from 60 to 100. Do not return picks below 60.
9. articleIds must use the original article ids, 1 to 3 per pick.
10. Return at most 12 picks, each company only once.
11. The reason must be under 25 words and use hedged wording ("may", "could").
    Do not state that the price will rise. Do not invent facts. Do not give
    buy, sell or hold advice.
12. Return {"picks": []} if nothing qualifies.

ARTICLES:
${JSON.stringify(articlesForAI)}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            maxOutputTokens: 8000,
        },
    });

    const responseText = response.text?.trim();

    if (!responseText) {
        console.error("Gemini returned an empty positive stocks response.");
        return [];
    }

    let parsed: {
        picks?: Array<{
            companyName?: string;
            nseTicker?: string;
            sector?: string;
            category?: string;
            confidence?: number;
            reason?: string;
            articleIds?: unknown;
        }>;
    };

    try {
        parsed = JSON.parse(responseText);
    } catch (error) {
        console.error("Failed to parse positive stocks JSON.", {
            error,
            responsePreview: responseText.slice(0, 500),
        });
        throw new Error("Gemini returned invalid JSON for positive stocks.");
    }

    if (!Array.isArray(parsed.picks)) {
        return [];
    }

    const validCategories = new Set(["company", "government", "global"]);
    const picks: PositiveStockPick[] = [];

    for (const item of parsed.picks) {
        if (
            typeof item.companyName !== "string" ||
            item.companyName.trim().length < 2 ||
            !validCategories.has(item.category ?? "") ||
            typeof item.reason !== "string" ||
            !item.reason.trim() ||
            typeof item.confidence !== "number" ||
            !Number.isFinite(item.confidence) ||
            item.confidence < 60 ||
            item.confidence > 100 ||
            !Array.isArray(item.articleIds)
        ) {
            continue;
        }

        const articleIds = Array.from(
            new Set(
                item.articleIds.filter(
                    (id): id is number =>
                        typeof id === "number" &&
                        Number.isInteger(id) &&
                        id >= 0 &&
                        id < articles.length
                )
            )
        ).slice(0, 3);

        if (articleIds.length === 0) {
            continue;
        }

        const companyName = item.companyName.trim();
        const ticker = (item.nseTicker ?? "")
            .trim()
            .toUpperCase()
            .replace(/\.(NS|BO)$/, "");

        // Guard against hallucinated companies: a company-specific pick must
        // actually be mentioned in the articles it cites.
        if (item.category === "company") {
            const needle = companyName.toLowerCase();

            const mentioned = articleIds.some((id) => {
                const text =
                    `${articles[id]!.title} ${articles[id]!.description}`.toLowerCase();

                return (
                    text.includes(needle) ||
                    (/^[A-Z0-9&-]{2,}$/.test(ticker) &&
                        new RegExp(
                            `\\b${ticker.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`
                        ).test(text))
                );
            });

            if (!mentioned) {
                continue;
            }
        }

        picks.push({
            companyName,
            nseTicker: ticker,
            sector: typeof item.sector === "string" ? item.sector.trim() : "",
            category: item.category as NewsCategory,
            confidence: Math.round(item.confidence),
            reason: item.reason.trim(),
            articleIds,
        });
    }

    return picks;
};
