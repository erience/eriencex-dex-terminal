import React, { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'

const Market = ({
  name,
  buyLoading,
  sellLoading,
  market,
  setMarket,
  buyingRange,
  handleMarket,
  marketBuy,
  marketSell,
  handleBuyRangeMarket,
  handleSellRangeMarket
}) => {
  const { freeCollateral } = useSelector(selectData)
  const [tabIndex, setTabIndex] = useState(0)

  const inputRefs = useRef({
    buyPrice: null,
    buySize: null,
    sellSize: null,
    sellPrice: null
  })
  const tabRefs = useRef([])

  const tabs = [
    'Buy',
    'Sell'
  ]
  const handleTabItemClick = (index) => {
    setTabIndex(index)
    tabRefs.current.forEach((tab, idx) => {
      if (tab) {
        if (index === idx) {
          tab.classList.add('active')
        } else {
          tab.classList.remove('active')
        }
      }
    })
  }

  const focusInput = (inputName) => {
    if (inputRefs.current[inputName]) {
      inputRefs.current[inputName].focus()
    }
  }
  return (
    <>
      <div className="relative grid grid-cols-12 gap-5 text-xs">
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
        <div className="col-span-12">
          <div className="tab-container !bg-transparent !p-0">
            <div className="tabs-wrapper">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  type="button"
                  className={`tab-item w-1/2 !p-2.5 ${index === 0 ? 'active' : ''}`}
                  ref={(el) => (tabRefs.current[index] = el)}
                  onClick={() => handleTabItemClick(index)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className='mt-2'>
              {tabIndex == 0 && (
                <div className="relative col-span-12 md:col-span-12">
                  <div className="relative grid grid-cols-12 gap-4">
                    <div className="relative col-span-12">
                      <div
                        onClick={() => focusInput('buySize')}
                        className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
                      >
                        <span className="py-2 px-3 text-gray-400 cursor-pointer">Amount</span>
                        <input
                          ref={(el) => (inputRefs.current.buySize = el)}
                          type="number"
                          value={market.buySize}
                          placeholder="0.00"
                          name="buySize"
                          onChange={handleMarket}
                          className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                        />
                        <span className="py-2 px-3">{name && name[0]}</span>
                      </div>
                    </div>
                    <div className="relative col-span-12">
                      <div
                        onClick={() => focusInput('buyPrice')}
                        className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
                      >
                        <span className="py-2 px-3 text-gray-400 cursor-pointer">Amount</span>
                        <input
                          ref={(el) => (inputRefs.current.buyPrice = el)}
                          type="number"
                          value={market.buyPrice}
                          placeholder="$0.0"
                          name="buyPrice"
                          onChange={handleMarket}
                          className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                        />
                        <span className="py-2 px-3">USDT</span>
                      </div>
                    </div>
                    <div className="relative col-span-12">
                      <div className="relative">
                        <input
                          type="range"
                          className="range range-success"
                          value={market.buyPrice}
                          onChange={handleBuyRangeMarket}
                          min={0}
                          max={buyingRange}
                        />
                      </div>
                    </div>
                    <div className="relative col-span-12">
                      <div
                        className={`${market.buyTimeInForce == 'GTT' ? 'cursor-not-allowed opacity-50' : ''} relative text-white form-control`}
                      >
                        <label htmlFor="buyreduce" className="label justify-start cursor-pointer gap-3">
                          <input
                            type="checkbox"
                            id="buyreduce"
                            checked={market.buyReduceOnly}
                            disabled={market.buyTimeInForce == 'GTT'}
                            onChange={(e) => setMarket({ ...market, buyReduceOnly: !market.buyReduceOnly })}
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
                          value={market.buyTotal}
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
                        onClick={marketBuy}
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
              )}

              {tabIndex == 1 && (
                <div className="relative col-span-12 md:col-span-12">
                  <div className="relative grid grid-cols-12 gap-4">
                    <div className="relative col-span-12">
                      <div
                        onClick={() => focusInput('sellSize')}
                        className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
                      >
                        <span className="py-2 px-3 text-gray-400 cursor-pointer">Amount</span>
                        <input
                          ref={(el) => (inputRefs.current.sellSize = el)}
                          type="number"
                          value={market.sellSize}
                          name="sellSize"
                          placeholder="0.00"
                          onChange={handleMarket}
                          className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                        />
                        <span className="py-2 px-3">{name && name[0]}</span>
                      </div>
                    </div>
                    <div className="relative col-span-12">
                      <div
                        onClick={() => focusInput('sellPrice')}
                        className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
                      >
                        <span className="py-2 px-3 text-gray-400 cursor-pointer">Amount</span>
                        <input
                          ref={(el) => (inputRefs.current.sellPrice = el)}
                          type="number"
                          value={market.sellPrice}
                          placeholder="$0.0"
                          name="sellPrice"
                          onChange={handleMarket}
                          className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                        />
                        <span className="py-2 px-3">USDT</span>
                      </div>
                    </div>
                    <div className="relative col-span-12">
                      <div className="relative">
                        <input
                          type="range"
                          className="range range-error"
                          value={market.sellPrice}
                          onChange={handleSellRangeMarket}
                          min={0}
                          max={buyingRange}
                        />
                      </div>
                    </div>
                    <div className="relative col-span-12">
                      <div
                        className={`${market.sellTimeInForce == 'GTT' ? 'cursor-not-allowed opacity-50' : ''} relative text-white form-control`}
                      >
                        <label htmlFor="sellreduce" className="label justify-start cursor-pointer gap-3">
                          <input
                            type="checkbox"
                            id="sellreduce"
                            checked={market.sellReduceOnly}
                            disabled={market.sellTimeInForce == 'GTT'}
                            onChange={(e) =>
                              setMarket({ ...market, sellReduceOnly: !market.sellReduceOnly })
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
                          value={market.sellTotal}
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
                        onClick={marketSell}
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
              )}
            </div>
          </div>
        </div>


      </div>
    </>
  )
}

export default Market
