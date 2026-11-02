
import { useMemo, useState } from "react";
import {
    Building2,
    Landmark,
    Globe,
    ExternalLink,
    Newspaper,
    Star,
    Filter,
} from "lucide-react";
import type { NewsArticle } from "../types/stock";

interface NewsPanelProps {
    data: NewsArticle[];
    loading: boolean;
}

type NewsCategory = "company" | "government" | "global";

const tabs: {
    id: NewsCategory;
    label: string;
    icon: typeof Building2;
}[] = [
        { id: "company", label: "Company News", icon: Building2 },
        { id: "government", label: "Government News", icon: Landmark },
        { id: "global", label: "Global News", icon: Globe },
    ];

const categoryDescriptions: Record<NewsCategory, string> = {
    company:
        "Company results, contracts, earnings and business updates.",
    government:
        "Government policies and regulations that may affect this stock.",
    global:
        "International developments that may influence this stock.",
};

function NewsPanel({ data, loading }: NewsPanelProps) {
    const [activeTab, setActiveTab] =
        useState<NewsCategory>("company");
    const [importantOnly, setImportantOnly] = useState(false);

    const sortedNews = useMemo(
        () =>
            [...data].sort(
                (a, b) =>
                    new Date(b.publishedAt).getTime() -
                    new Date(a.publishedAt).getTime()
            ),
        [data]
    );

    const categoryCounts = useMemo(() => {
        return {
            company: sortedNews.filter(
                (article) => article.category === "company"
            ).length,
            government: sortedNews.filter(
                (article) => article.category === "government"
            ).length,
            global: sortedNews.filter(
                (article) => article.category === "global"
            ).length,
        };
    }, [sortedNews]);

    const filteredNews = sortedNews.filter(
        (article) =>
            article.category === activeTab &&
            (!importantOnly || article.importance === "high")
    );

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                        <Newspaper size={22} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-950">
                            Stock News
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            News and events relevant to the selected stock
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {/* Category tabs */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {tabs.map(({ id, label, icon: Icon }) => {
                        const active = activeTab === id;

                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-3 text-left transition ${active
                                        ? "border-blue-200 bg-blue-50 text-blue-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Icon size={18} />
                                    <span className="text-sm font-semibold">
                                        {label}
                                    </span>
                                </span>

                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${active
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-slate-100 text-slate-600"
                                        }`}
                                >
                                    {categoryCounts[id]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <p className="mt-3 text-sm leading-5 text-slate-500">
                    {categoryDescriptions[activeTab]}
                </p>

                {/* Important news filter */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <p className="text-sm font-semibold text-slate-700">
                        {filteredNews.length}{" "}
                        {filteredNews.length === 1 ? "article" : "articles"}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            setImportantOnly((previous) => !previous)
                        }
                        aria-pressed={importantOnly}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${importantOnly
                                ? "border-amber-300 bg-amber-50 text-amber-800"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        <Filter size={15} />
                        <Star
                            size={15}
                            className={
                                importantOnly ? "fill-amber-400" : ""
                            }
                        />
                        Important Only
                    </button>
                </div>

                {/* News content */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                            <p className="mt-3 text-sm text-slate-500">
                                Loading stock news...
                            </p>
                        </div>
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <Newspaper size={22} />
                        </div>

                        <h3 className="mt-3 text-sm font-semibold text-slate-800">
                            No matching news found
                        </h3>

                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                            {importantOnly
                                ? "No important articles are available in this category. Turn off the Important Only filter to see all articles."
                                : "No articles are currently available in this category for the selected stock."}
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {filteredNews.map((article) => (
                            <a
                                key={article.url}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex h-full flex-col rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="line-clamp-3 text-sm font-bold leading-6 text-slate-900 group-hover:text-blue-700">
                                        {article.title}
                                    </h3>

                                    <ExternalLink
                                        size={16}
                                        className="mt-1 shrink-0 text-slate-400 transition group-hover:text-blue-600"
                                    />
                                </div>

                                {article.importance === "high" && (
                                    <div className="mt-3">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                            <Star
                                                size={12}
                                                className="fill-amber-400"
                                            />
                                            Important
                                        </span>
                                    </div>
                                )}

                                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                                    {article.description ||
                                        "No description available."}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
                                    <span className="font-semibold text-slate-600">
                                        {article.source || "News source"}
                                    </span>

                                    <span>
                                        {article.publishedAt &&
                                            !Number.isNaN(
                                                new Date(
                                                    article.publishedAt
                                                ).getTime()
                                            )
                                            ? new Date(
                                                article.publishedAt
                                            ).toLocaleDateString(
                                                "en-IN",
                                                {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                }
                                            )
                                            : "Date unavailable"}
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default NewsPanel;
