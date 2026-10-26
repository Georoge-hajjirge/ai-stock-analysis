interface SearchBarProps {
    query: string;
    onQueryChange: (value: string) => void;
    onSearch: () => void;
    loading: boolean;
}

function SearchBar({
    query,
    onQueryChange,
    onSearch,
    loading,
}: SearchBarProps) {
    return (
        <div className="flex w-full max-w-2xl gap-3">
            <input
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder="Search stock e.g. TCS"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            <button
                onClick={onSearch}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? "Searching..." : "Search"}
            </button>
        </div>
    );
}

export default SearchBar;