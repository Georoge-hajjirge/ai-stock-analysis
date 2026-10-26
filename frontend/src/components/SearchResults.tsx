import type { StockSearchResult } from "../types/stock";

interface SearchResultsProps {
    results: StockSearchResult[];
    onSelect: (stock: StockSearchResult) => void;
}

function SearchResults({ results, onSelect }: SearchResultsProps) {
    if (results.length === 0) return null;

    return (
        <div className="mt-6 w-full max-w-2xl">
            <h2 className="mb-3 text-lg font-semibold">Search Results</h2>

            <div className="space-y-2">
                {results.map((stock) => (
                    <button
                        key={stock.symbol}
                        onClick={() => onSelect(stock)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
                    >
                        <div className="font-bold">{stock.symbol}</div>
                        <div className="text-gray-600">{stock.name}</div>
                        <div className="mt-1 text-sm text-gray-500">
                            {stock.exchangeDisplayName || stock.exchange}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default SearchResults;