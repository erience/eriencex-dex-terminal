import React from 'react'

const AboutGridBotModal = () => {
  return (
    <>
      <dialog id="about_gridbot" className="modal bg-black/[0.5]">
        <div className="modal-box max-w-3xl w-full pt-0 p-6 max-h-[500px] vertical-thin">
          <div className="sticky top-0 z-10 bg-[#1e2026] pb-6">
            <div className="relative">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-3 top-4 z-10"
                onClick={() => document.getElementById('about_gridbot').close()}
              >
                ✕
              </button>
              <h3 className="font-bold text-lg text-center pt-6">Grid Bot Setup Instructions:</h3>
            </div>
          </div>
          <div className="space-y-6">
            {/* From and To Price */}
            <div>
              <h3 className="text-lg font-semibold">From and To Price:</h3>
              <p className="text-sm text-grat-400">
                <span className="font-semibold">What to do:</span> Set the price range in which you
                want the Grid Bot to operate.
              </p>
              <p className="text-sm text-grat-400 mt-2">
                <span className="font-semibold">Example:</span> For Bitcoin, if you set the start
                price to $60,000 and the stop price to $90,000, the bot will only make trades while
                Bitcoin’s price is between $60K and $90K.
              </p>
            </div>

            {/* Investment Amount */}
            <div>
              <h3 className="text-lg font-semibold">Investment Amount:</h3>
              <p className="text-sm text-grat-400">
                <span className="font-semibold">What to do:</span> Decide how much money you want
                the bot to use for trading.
              </p>
              <p className="text-sm text-grat-400 mt-2">
                <span className="font-semibold">Example:</span> If you enter $10,000, the bot will
                use that entire amount of your USDC balance for trades. If you don’t have $10,000 in
                your account, the bot will use leverage (borrowed funds) to reach the amount needed.
              </p>
            </div>

            {/* Number of Grids */}
            <div>
              <h3 className="text-lg font-semibold">Number of Grids:</h3>
              <p className="text-sm text-grat-400">
                <span className="font-semibold">What to do:</span> Set how many trading levels (or
                grids) you want the bot to work with.
              </p>
              <p className="text-sm text-grat-400 mt-2">
                <span className="font-semibold">Example:</span> If you set 100 grids, the bot will
                divide your $10,000 investment into 100 smaller amounts, so each grid gets around
                $100 to trade with.
              </p>
            </div>

            {/* Slippage */}
            <div>
              <h3 className="text-lg font-semibold">Slippage:</h3>
              <p className="text-sm text-grat-400">
                <span className="font-semibold">What to do:</span> Set how much the price can move
                before the bot buys or sells.
              </p>
              <p className="text-sm text-grat-400 mt-2">
                <span className="font-semibold">Example:</span> If your bot is set to enter a trade
                at $60,200 and you set a 0.05% slippage, the bot will allow for a small price range
                from $60,169.10 to $60,230.10. The bot will buy when the price hits anywhere in this
                range.
              </p>
            </div>

            {/* Take Profit Percentage */}
            <div>
              <h3 className="text-lg font-semibold">Take Profit Percentage:</h3>
              <p className="text-sm text-grat-400">
                <span className="font-semibold">What to do:</span> Decide how much profit you want
                to make before the bot closes a trade.
              </p>
              <p className="text-sm text-grat-400 mt-2">
                <span className="font-semibold">Example:</span> If your entry price was $60,169.10
                and you set a 0.20% take profit, the bot will sell the grid when the price reaches
                $60,289.44.
              </p>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  )
}

export default AboutGridBotModal
