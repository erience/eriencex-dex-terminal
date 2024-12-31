import React from 'react'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'

const TakeProfitMarket = ({
  name,
  buyingRange,
  profitMarket,
  setProfitMarket,
  profitMarketBuy,
  profitMarketSell,
  handleProfitMarketChange,
  handleBuyRangeProfitMarket,
  handleSellRangeProfitMarket,
  buyLoading,
  sellLoading
}) => {
  const { freeCollateral } = useSelector(selectData)
  return (
    <>
      <div className="relative grid grid-cols-12 gap-5">
        <div className="relative col-span-12 md:col-span-6">
          <div className="relative grid grid-cols-12 gap-4">
            <div className="relative flex justify-between col-span-12">
              <div className="text-xs text-gray-400">
                Avbl
                <span className="text-white mx-1">{freeCollateral.toFixed()} USDT</span>
              </div>
              <div className="text-xs text-gray-400">
                BuyingPower
                <span className="text-white mx-1">{buyingRange} USDT</span>
              </div>
            </div>
            <div className="relative col-span-12">
              <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
                <span className="py-2 px-3 text-gray-400">Trigger Price</span>
                <input
                  type="number"
                  value={profitMarket.buyTriggerPrice}
                  name="buyTriggerPrice"
                  placeholder="$0.0"
                  onChange={handleProfitMarketChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">USDT</span>
              </div>
            </div>

            <div className="relative col-span-12">
              <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
                <span className="py-2 px-3 text-gray-400">Amount</span>
                <input
                  type="number"
                  value={profitMarket.buySize}
                  placeholder="0.00"
                  name="buySize"
                  onChange={handleProfitMarketChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">{name && name[0]}</span>
              </div>
            </div>
            <div className="relative col-span-12">
              <div className="relative">
                <input
                  type="range"
                  className="range range-success"
                  value={profitMarket.buyPrice}
                  onChange={handleBuyRangeProfitMarket}
                  min={0}
                  max={buyingRange}
                />
              </div>
            </div>

            <div className="relative col-span-12">
              <div className="relative text-black">
                <select
                  name="buyTimeInForce"
                  value={profitMarket.buyTimeInForce}
                  onChange={(e) =>
                    setProfitMarket({ ...profitMarket, buyTimeInForce: e.target.value })
                  }
                  className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                >
                  <option value="IOC">Immediate or Cancel</option>
                </select>
              </div>
            </div>
            <div className="relative col-span-12">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative text-black">
                  <input
                    type="number"
                    name="buyTime"
                    value={profitMarket.buyTime}
                    onChange={handleProfitMarketChange}
                    placeholder="enter number"
                    className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                  />
                </div>
                <div className="relative text-black">
                  <select
                    name="buyTimeFrame"
                    value={profitMarket.buyTimeFrame}
                    onChange={(e) =>
                      setProfitMarket({ ...profitMarket, buyTimeFrame: e.target.value })
                    }
                    className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                  >
                    <option value="minute">Mins</option>
                    <option value="hour">Hours</option>
                    <option value="day">Days</option>
                    <option value="week">Weeks</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="relative col-span-12">
              <div
                className={`${profitMarket.buyTimeInForce == 'GTT' ? 'cursor-not-allowed opacity-50' : ''} relative text-white form-control`}
              >
                <label htmlFor="buyreduce" className="label justify-start cursor-pointer gap-3">
                  <input
                    type="checkbox"
                    id="buyreduce"
                    checked={profitMarket.buyReduceOnly}
                    disabled={profitMarket.buyTimeInForce == 'GTT'}
                    onChange={(e) =>
                      setProfitMarket({
                        ...profitMarket,
                        buyReduceOnly: !profitMarket.buyReduceOnly
                      })
                    }
                    className="checkbox checkbox-primary"
                  />
                  <span>Reduce Only</span>
                </label>
              </div>
            </div>

            <div className="relative col-span-12">
              <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
                <span className="py-2 px-3 text-gray-400">Total</span>
                <input
                  type="number"
                  value={profitMarket.buyTotal}
                  placeholder="$0.0"
                  readOnly
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">USDT</span>
              </div>
            </div>
            <div className="relative col-span-12">
              <button
                type="button"
                className="relative inline-block w-full h-full min-h-11 bg-[#11e7b0] text-white rounded-md hover:bg-[#14b38a] transition-all duration-300"
                onClick={profitMarketBuy}
                disabled={buyLoading}
              >
                {buyLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A8.004 8.004 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647zM20 12c0-3.042-1.135-5.824-3-7.938l-3 2.647A7.963 7.963 0 0116 12h4zm-6 7.938A7.963 7.963 0 0120 12h4c0 6.627-5.373 12-12 12v-4z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  `Buy ${name && name[0]}`
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="relative col-span-12 md:col-span-6">
          <div className="relative grid grid-cols-12 gap-4">
            <div className="relative flex justify-between col-span-12">
              <div className="text-xs text-gray-400">
                Avbl
                <span className="text-white mx-1">{freeCollateral.toFixed()} USDT</span>
              </div>
              <div className="text-xs text-gray-400">
                BuyingPower
                <span className="text-white mx-1">{buyingRange} USDT</span>
              </div>
            </div>
            <div className="relative col-span-12">
              <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
                <span className="py-2 px-3 text-gray-400">Trigger Price</span>
                <input
                  type="number"
                  value={profitMarket.sellTriggerPrice}
                  name="sellTriggerPrice"
                  placeholder="$0.0"
                  onChange={handleProfitMarketChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">USDT</span>
              </div>
            </div>

            <div className="relative col-span-12">
              <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
                <span className="py-2 px-3 text-gray-400">Amount</span>
                <input
                  type="number"
                  value={profitMarket.sellSize}
                  name="sellSize"
                  onChange={handleProfitMarketChange}
                  placeholder="0.00"
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">{name && name[0]}</span>
              </div>
            </div>
            <div className="relative col-span-12">
              <div className="relative">
                <input
                  type="range"
                  className="range range-error"
                  value={profitMarket.sellPrice}
                  onChange={handleSellRangeProfitMarket}
                  min={0}
                  max={buyingRange}
                />
              </div>
            </div>

            <div className="relative col-span-12">
              <div className="relative text-black">
                <select
                  name="sellTimeInForce"
                  value={profitMarket.sellTimeInForce}
                  onChange={(e) =>
                    setProfitMarket({ ...profitMarket, sellTimeInForce: e.target.value })
                  }
                  className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                >
                  <option value="IOC">Immediate or Cancel</option>
                </select>
              </div>
            </div>
            <div className="relative col-span-12">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative text-black">
                  <input
                    type="number"
                    name="sellTime"
                    value={profitMarket.sellTime}
                    onChange={handleProfitMarketChange}
                    placeholder="enter number"
                    className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                  />
                </div>
                <div className="relative text-black">
                  <select
                    name="sellTimeFrame"
                    value={profitMarket.sellTimeFrame}
                    onChange={(e) =>
                      setProfitMarket({ ...profitMarket, sellTimeFrame: e.target.value })
                    }
                    className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                  >
                    <option value="minute">Mins</option>
                    <option value="hour">Hours</option>
                    <option value="day">Days</option>
                    <option value="week">Weeks</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="relative col-span-12">
              <div
                className={`${profitMarket.sellTimeInForce == 'GTT' ? 'cursor-not-allowed opacity-50' : ''} relative text-white form-control`}
              >
                <label htmlFor="sellreduce" className="label justify-start cursor-pointer gap-3">
                  <input
                    type="checkbox"
                    id="sellreduce"
                    checked={profitMarket.sellReduceOnly}
                    disabled={profitMarket.sellTimeInForce == 'GTT'}
                    onChange={(e) =>
                      setProfitMarket({
                        ...profitMarket,
                        sellReduceOnly: !profitMarket.sellReduceOnly
                      })
                    }
                    className="checkbox checkbox-primary"
                  />
                  <span>Reduce Only</span>
                </label>
              </div>
            </div>

            <div className="relative col-span-12">
              <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
                <span className="py-2 px-3 text-gray-400">Total</span>
                <input
                  type="number"
                  value={profitMarket.sellTotal}
                  placeholder="$0.0"
                  readOnly
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">USDT</span>
              </div>
            </div>
            <div className="relative col-span-12">
              <button
                type="button"
                className="relative inline-block w-full h-full min-h-11 bg-[#eb4034] text-white rounded-md hover:bg-[#b52f26] transition-all duration-300"
                onClick={profitMarketSell}
                disabled={sellLoading}
              >
                {sellLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A8.004 8.004 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647zM20 12c0-3.042-1.135-5.824-3-7.938l-3 2.647A7.963 7.963 0 0116 12h4zm-6 7.938A7.963 7.963 0 0120 12h4c0 6.627-5.373 12-12 12v-4z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  `Sell ${name && name[0]}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TakeProfitMarket