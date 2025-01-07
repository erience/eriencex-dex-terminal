import React from 'react';

const AboutCopyBotModal = () => {
  return (
    <>
      <dialog id="about_copybot" className="modal bg-black/[0.5]">
        <div className="modal-box max-w-3xl w-full pt-0 p-6 max-h-[500px] vertical-thin">
          <div className="sticky top-0 z-10 bg-[#1e2026] pb-6">
            <div className="relative">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-3 top-4 z-10"
                onClick={() => document.getElementById('about_copybot').close()}
              >
                ✕
              </button>
              <h3 className="font-bold text-lg text-center pt-6">
                Trade Copying Setup Instructions:
              </h3>
            </div>
          </div>
          <div className="space-y-6">
            {/* Enter URL */}
            <div>
              <h3 className="text-lg font-semibold">Enter URL:</h3>
              <p className="text-sm text-grat-400">
                <span className="font-semibold">What to do:</span> Paste the URL of the wallet or trading account you want to copy trades from.
              </p>
              <p className="text-sm text-grat-400 mt-2">
                <span className="font-semibold">Example:</span> If the source URL is
                <code> https://dydxboard.com/ZHlkeDE0ZGx0YzJ3NnkzZGhmMG5hejhsdWdsc3ZqdDB2aHZzd20yajZkMA==</code>, copy and paste it here.
              </p>
            </div>

            {/* Select Market Sides */}
            <div>
              <h3 className="text-lg font-semibold">Select Market Sides:</h3>
              <p className="text-sm text-grat-400">
                <span className="font-semibold">What to do:</span> Decide which types of trades you want to copy:
              </p>
              <ul className="text-sm text-grat-400 list-disc pl-5 mt-2">
                <li><span className="font-semibold">Long:</span> Only copy long positions (buying with the expectation of price increase).</li>
                <li><span className="font-semibold">Short:</span> Only copy short positions (selling with the expectation of price decrease).</li>
                <li><span className="font-semibold">Both:</span> Copy both long and short trades.</li>
              </ul>
            </div>

            {/* Select Markets */}
            <div>
              <h3 className="text-lg font-semibold">Select Markets:</h3>
              <p className="text-sm text-grat-400">
                <span className="font-semibold">What to do:</span> Choose which markets to copy trades for:
              </p>
              <ul className="text-sm text-grat-400 list-disc pl-5 mt-2">
                <li><span className="font-semibold">All Markets:</span> Copy trades from all available markets.</li>
                <li><span className="font-semibold">Specific Markets:</span> Select individual markets (e.g., BTC, ETH, SOL).</li>
              </ul>
            </div>

            {/* Set Trade Percentage */}
            <div>
              <h3 className="text-lg font-semibold">Set Trade Percentage:</h3>
              <p className="text-sm text-grat-400">
                <span className="font-semibold">What to do:</span> Define the percentage of the original trade value you want to replicate:
              </p>
              <p className="text-sm text-grat-400 mt-2">
                <span className="font-semibold">Example 1:</span> If the original trade is $100 and you enter 100%, your trade will also be $100.
              </p>
              <p className="text-sm text-grat-400 mt-2">
                <span className="font-semibold">Example 2:</span> If the original trade is $100 and you enter 10%, your trade will be $10.
              </p>
            </div>

            {/* Disclaimer */}
            <div>
              <h3 className="text-lg font-semibold">Disclaimer:</h3>
              <p className="text-sm text-grat-400">
                If the original order size is greater than the trade amount you selected, the bot will automatically place the order using the nearest possible trade size.
              </p>
              <p className="text-sm text-grat-400 mt-2">
                <span className="font-semibold">Example:</span> If the original order is for $150 and you selected a trade percentage that results in $12, but the minimum order size allowed by the market is $20, the bot will place an order for $20 instead.
              </p>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};

export default AboutCopyBotModal;
