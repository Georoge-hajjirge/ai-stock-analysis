import type { NewsArticle } from "../types/stock";

interface NewsPanelProps {
    data: NewsArticle[];
    loading: boolean;
}

function NewsPanel({ data, loading }: NewsPanelProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <h2 className="text-lg font-bold text-slate-950">
                    Latest News
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Recent news and market updates
                </p>
            </div>

            <div className="p-5 sm:p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                            <p className="mt-3 text-sm text-slate-500">
                                Loading latest news...
                            </p>
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="py-10 text-center">
                        <p className="text-sm text-slate-500">
                            No news available for this stock.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {data.map((article) => (
                            <a
                                key={article.url}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <h3 className="line-clamp-2 text-sm font-bold leading-6 text-slate-900 group-hover:text-blue-600">
                                        {article.title}
                                    </h3>

                                    <span className="shrink-0 text-slate-300 transition group-hover:text-blue-500">
                                        ↗
                                    </span>
                                </div>

                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                                    {article.description ||
                                        "No description available."}
                                </p>

                                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-400">
                                    <span className="font-semibold text-slate-600">
                                        {article.source}
                                    </span>

                                    <span>
                                        {new Date(
                                            article.publishedAt
                                        ).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
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