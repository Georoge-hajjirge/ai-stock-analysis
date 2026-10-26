import ReactMarkdown from "react-markdown";

interface AIAnalysisPanelProps {
    analysis: string;
    loading: boolean;
    onGenerate: () => void;
}

function AIAnalysisPanel({
    analysis,
    loading,
    onGenerate,
}: AIAnalysisPanelProps) {
    return (
        <div className="mt-8 w-full max-w-4xl rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                    AI Stock Analysis
                </h2>

                <button
                    onClick={onGenerate}
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Analyzing..." : "Generate Analysis"}
                </button>
            </div>

            {loading && (
                <p className="mt-5 text-gray-600">
                    Gemini is analyzing the stock data...
                </p>
            )}

            {analysis && !loading && (
                <div className="mt-6 text-gray-700">
                    <ReactMarkdown
                        components={{
                            h3: ({ children }) => (
                                <h3 className="mt-6 mb-3 text-lg font-bold text-gray-900">
                                    {children}
                                </h3>
                            ),

                            p: ({ children }) => (
                                <p className="mb-4 leading-7">
                                    {children}
                                </p>
                            ),

                            ul: ({ children }) => (
                                <ul className="mb-5 list-disc space-y-2 pl-6">
                                    {children}
                                </ul>
                            ),

                            li: ({ children }) => (
                                <li className="leading-7">
                                    {children}
                                </li>
                            ),

                            strong: ({ children }) => (
                                <strong className="font-semibold text-gray-900">
                                    {children}
                                </strong>
                            ),

                            hr: () => (
                                <hr className="my-6 border-gray-200" />
                            ),
                        }}
                    >
                        {analysis}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
}

export default AIAnalysisPanel;