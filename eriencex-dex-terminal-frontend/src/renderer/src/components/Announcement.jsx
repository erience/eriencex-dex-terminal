import React, { useEffect } from "react";
import Marquee from "react-fast-marquee";
import { useSelector } from "react-redux";
import { selectData } from "../redux-toolkit/dataSlice";
import { formatPairName, formatWithCommas } from "../utils/helper";

const Announcement = () => {
  const { cryptoPair } = useSelector(selectData);

  return (
    <>
      <div className="relative bg-semi-dark text-xs text-light-gray">
        <Marquee>
          {cryptoPair.length > 0 ? (
            cryptoPair.map((pair, i) => {
              const per = parseFloat((pair?.priceChange24H * 100) / pair?.oraclePrice).toFixed(2);
              const success = per > 0;
              const price = parseFloat(pair?.oraclePrice);
              const decimalPlaces = Math.max(0, Math.round(-Math.log10(pair?.tickSize || 1)));

              return (
                <span key={i} className="mr-2 flex items-center">
                  <span className="text-gray-400">{formatPairName(pair?.ticker)}</span>
                  <span className="mx-2">
                    {formatWithCommas(price, decimalPlaces)} USD
                  </span>
                  <span className={`${success ? "primary-color" : "secondary-color"}`}>
                    {success ? "+" : "-"}
                    {formatWithCommas(Math.abs(per), 2)}%
                  </span>
                  {/* Add separator unless it's the last item */}
                  {i < cryptoPair.length - 1 && (
                    <span className="mx-2 text-gray-400">|</span>
                  )}
                </span>
              );
            })
          ) : (
            <div className="flex space-x-4">
              {/* Skeleton loader */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center animate-pulse">
                  <div className="h-4 w-16 bg-gray-300 rounded"></div>
                  <div className="h-4 w-24 bg-gray-300 rounded mx-2"></div>
                  <div className="h-4 w-12 bg-gray-300 rounded"></div>
                  {i < 4 && <div className="mx-2 h-4 w-4 bg-gray-300 rounded"></div>}
                </div>
              ))}
            </div>
          )}

        </Marquee>
      </div>
    </>
  );
};

export default Announcement;
