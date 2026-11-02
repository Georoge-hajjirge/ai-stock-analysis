
import { GoogleGenAI } from "@google/genai";
import type { NewsArticle, NewsCandidate, NewsCategory, NewsImportance } from "./newsService.js";
import type {
    HistoricalStockData,
    StockData,
    StockFundamentals,
} from "./stockService.js";
import type {
    InvestmentScenario,
    ParsedInvestmentRequest,
} from "./investmentPredictionService.js";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({ apiKey });






interface AnalyzeStockNewsInput {
    symbol: string;
    companyName: string;
    articles: NewsCandidate[];
}

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


interface AIStockComparisonItem {
    symbol: string;
    stock: StockData;
    history: HistoricalStockData[];
    fundamentals: StockFundamentals | null;
    news: NewsArticle[];
}


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


interface AIStockQuestionInput {
    stock: StockData;
    fundamentals: StockFundamentals | null;
    historicalData: HistoricalStockData[];
    news: NewsArticle[];
    question: string;
    investmentRequest?: ParsedInvestmentRequest;
    investmentScenario?: InvestmentScenario;
}



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
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text ?? "No answer generated.";
    } catch (error: unknown) {
        console.error("Gemini AI question error:", error);
        throw new Error("Failed to answer stock question");
    }
};


