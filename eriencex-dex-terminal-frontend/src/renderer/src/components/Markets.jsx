import React from "react";
import MarketPair from "./MarketPair";
import MarketTrades from "./MarketTrades";

const Markets = () => {
  return (
    <>
      <div className="relative col-span-12 xxl:col-span-3 border-l border-gray-700">
        <div className="relative py-5 px-3">
          <MarketPair />
          <MarketTrades />
        </div>
      </div>
    </>
  );
};

export default Markets;
