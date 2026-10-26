import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface AIQuestionPanelProps {
    question: string;
    messages: ChatMessage[];
    loading: boolean;
    onQuestionChange: (question: string) => void;
    onAsk: () => void;
    onClear: () => void;
}

const suggestions = [
    "If I invest ₹1,000 in this stock for 2 days, what could my profit or loss be?",
    "If I invest ₹5,000 for 1 week, what are the possible outcomes?",
    "What recent news could affect this stock?",
    "What are the main risks of this stock?",
];

function AIQuestionPanel({
    question,
    messages,
    loading,
    onQuestionChange,
    onAsk,
    onClear,
}: AIQuestionPanelProps) {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (
            event.key === "Enter" &&
            question.trim() &&
            !loading
        ) {
            event.preventDefault();
            onAsk();
        }
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                            ✦
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-950">
                                AI Stock Assistant
                            </h2>

                            <p className="text-xs text-slate-500">
                                Stock insights, investment scenarios and news
                            </p>
                        </div>
                    </div>
                </div>

                {messages.length > 0 && (
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={loading}
                        className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Clear chat
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="min-h-[300px] max-h-[600px] overflow-y-auto p-5 sm:p-6">
                {messages.length === 0 ? (
                    <div className="flex min-h-[250px] items-center justify-center">
                        <div className="max-w-xl text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
                                ✦
                            </div>

                            <h3 className="mt-4 font-bold text-slate-900">
                                Explore {`this stock`} with AI
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Ask about possible profit or loss, choose your
                                own investment amount and duration, understand
                                stock risks, or explore relevant news.
                            </p>

                            <div className="mt-6 text-left">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Try asking
                                </p>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() =>
                                                onQuestionChange(
                                                    suggestion.replace(
                                                        "this stock",
                                                        "this stock"
                                                    )
                                                )
                                            }
                                            disabled={loading}
                                            className="rounded-xl border border-slate-200 p-3 text-left text-sm leading-5 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[95%] break-words rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[85%] ${message.role === "user"
                                            ? "rounded-br-md bg-slate-950 text-white"
                                            : "rounded-bl-md border border-slate-100 bg-slate-50 text-slate-700"
                                        }`}
                                >
                                    {message.role === "assistant" ? (
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ children }) => (
                                                    <h1 className="mb-3 text-lg font-bold text-slate-950">
                                                        {children}
                                                    </h1>
                                                ),

                                                h2: ({ children }) => (
                                                    <h2 className="mb-2 mt-4 text-base font-bold text-slate-950 first:mt-0">
                                                        {children}
                                                    </h2>
                                                ),

                                                h3: ({ children }) => (
                                                    <h3 className="mb-2 mt-3 text-sm font-bold text-slate-950">
                                                        {children}
                                                    </h3>
                                                ),

                                                p: ({ children }) => (
                                                    <p className="mb-3 last:mb-0">
                                                        {children}
                                                    </p>
                                                ),

                                                ul: ({ children }) => (
                                                    <ul className="mb-3 list-disc space-y-1 pl-5">
                                                        {children}
                                                    </ul>
                                                ),

                                                ol: ({ children }) => (
                                                    <ol className="mb-3 list-decimal space-y-1 pl-5">
                                                        {children}
                                                    </ol>
                                                ),

                                                li: ({ children }) => (
                                                    <li>{children}</li>
                                                ),

                                                strong: ({ children }) => (
                                                    <strong className="font-bold text-slate-950">
                                                        {children}
                                                    </strong>
                                                ),

                                                em: ({ children }) => (
                                                    <em>{children}</em>
                                                ),

                                                blockquote: ({ children }) => (
                                                    <blockquote className="my-3 border-l-4 border-blue-300 pl-4 italic text-slate-600">
                                                        {children}
                                                    </blockquote>
                                                ),

                                                a: ({ children, href }) => (
                                                    <a
                                                        href={href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="break-all font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
                                                    >
                                                        {children}
                                                    </a>
                                                ),

                                                hr: () => (
                                                    <hr className="my-4 border-slate-200" />
                                                ),

                                                code: ({ children }) => (
                                                    <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-800">
                                                        {children}
                                                    </code>
                                                ),
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    ) : (
                                        message.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
                                    <p className="mb-2 text-xs text-slate-500">
                                        Analyzing stock data and relevant news...
                                    </p>

                                    <div className="flex items-center gap-1">
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:100ms]" />
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:200ms]" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-4 sm:p-5">
                <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-2 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                    <input
                        type="text"
                        value={question}
                        onChange={(event) =>
                            onQuestionChange(event.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        placeholder="Ask about investment amount, duration, returns or news..."
                        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
                    />

                    <button
                        type="button"
                        onClick={onAsk}
                        disabled={!question.trim() || loading}
                        className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {loading ? "..." : "Send"}
                    </button>
                </div>

                <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                    Estimates are hypothetical, not guaranteed returns or
                    financial advice. Market prices can change at any time.
                </p>
            </div>
        </section>
    );
}

export default AIQuestionPanel;