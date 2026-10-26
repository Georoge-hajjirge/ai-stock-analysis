import {
    searchStocks,
    getStockData,
    getHistoricalData,
} from "./services/stockService.js";

const test = async () => {
    try {
        console.log("=================================");
        console.log("Testing Yahoo Finance Stock API");
        console.log("=================================");

        console.log("\n1. Searching for TCS...");

        const searchResults = await searchStocks("TCS");

        console.log(JSON.stringify(searchResults, null, 2));

        if (searchResults.length === 0) {
            throw new Error("No stocks found");
        }

        const selectedStock =
            searchResults.find(
                (stock) => stock.symbol === "TCS.NS"
            ) || searchResults[0];

        console.log("\n2. Selected stock:");
        console.log(JSON.stringify(selectedStock, null, 2));

        console.log(
            `\n3.Getting current price for ${selectedStock.symbol}...`
        );

        const stockData = await getStockData(
            selectedStock.symbol
        );

        console.log(JSON.stringify(stockData, null, 2));

        const periods = ["1D", "1W", "1M", "6M", "1Y"] as const;

        for (const period of periods) {
            console.log(
                `\n4.Getting ${period} historical data for ${selectedStock.symbol}...`
            );

            const historicalData = await getHistoricalData(
                selectedStock.symbol,
                period
            );

            console.log(
                `Received ${historicalData.length} records`
            );

            console.log("First record:");
            console.log(
                JSON.stringify(historicalData[0], null, 2)
            );

            console.log("Last record:");
            console.log(
                JSON.stringify(
                    historicalData[historicalData.length - 1],
                    null,
                    2
                )
            );
        }

        console.log("\n=================================");
        console.log("TEST PASSED");
        console.log("=================================");
    } catch (error: unknown) {
        console.error("\n=================================");
        console.error("TEST FAILED");
        console.error("=================================");
        console.error(error);
        process.exit(1);
    }
};

test();
