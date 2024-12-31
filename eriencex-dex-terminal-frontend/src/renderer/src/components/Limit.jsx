import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'

const Limit = ({
  name,
  handleLimitChange,
  limit,
  setLimit,
  buyingRange,
  limitBuy,
  limitSell,
  handleBuyRangeLimit,
  handleSellRangeLimit,
  buyLoading,
  sellLoading
}) => {
  const { freeCollateral } = useSelector(selectData)
  const [isOpenBuy, setIsOpenBuy] = useState(false)
  const [isOpenSell, setIsOpenSell] = useState(false)
  const inputRefs = useRef({
    buyLimitPrice: null,
    buySize: null,
    sellLimitPrice: null,
    sellSize: null
  })

  const focusInput = (inputName) => {
    if (inputRefs.current[inputName]) {
      inputRefs.current[inputName].focus()
    }
  }

  return (
    <>
      <div className="relative grid grid-cols-12 gap-5">
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
        <div className="relative col-span-12 md:col-span-6">
          <div className="relative grid grid-cols-12 gap-4">
            <div className="relative col-span-12">
              <div
                className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
                onClick={() => focusInput('buyLimitPrice')}
              >
                <span className="py-2 px-3 text-gray-400 cursor-pointer">Limit Price</span>
                <input
                  ref={(el) => (inputRefs.current.buyLimitPrice = el)}
                  type="number"
                  value={limit.buyLimitPrice}
                  placeholder="$0.0"
                  name="buyLimitPrice"
                  onChange={handleLimitChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">USDT</span>
              </div>
            </div>

            <div className="relative col-span-12">
              <div
                onClick={() => focusInput('buySize')}
                className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
              >
                <span className="py-2 px-3 text-gray-400 cursor-pointer">Amount</span>
                <input
                  ref={(el) => (inputRefs.current.buySize = el)}
                  type="number"
                  value={limit.buySize}
                  name="buySize"
                  placeholder="0.00"
                  onChange={handleLimitChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">{name && name[0]}</span>
              </div>
            </div>
            {/* <div className="relative col-span-12">
              <div className="relative">
                <input
                  type="range"
                  name="buyLimitPrice"
                  className="range range-success"
                  value={limit.buyLimitPrice}
                  onChange={handleBuyRangeLimit}
                  min={0}
                  max={buyingRange}
                />
              </div>
            </div> */}

            <div className="relative col-span-12">
              <button
                className="w-full px-4 py-2 text-left bg-[#2A2D35] text-white rounded-md flex justify-between items-center"
                onClick={() => setIsOpenBuy(!isOpenBuy)}
              >
                <span>Advanced Settings</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-300 ${isOpenBuy ? '' : 'rotate-180'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
            </div>

            {isOpenBuy && (
              <>
                <div className="relative col-span-12">
                  <div className="relative text-black">
                    <select
                      name="timeInForce"
                      value={limit.buyTimeInForce}
                      onChange={(e) => setLimit({ ...limit, buyTimeInForce: e.target.value })}
                      className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                    >
                      <option value="GTT">Good Till Time</option>
                      <option value="IOC">Immediate or Cancel</option>
                    </select>
                  </div>
                </div>
                {limit.buyTimeInForce == 'GTT' && (
                  <div className="relative col-span-12">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <div className="relative text-black">
                          <input
                            type="number"
                            name="buyTime"
                            value={limit.buyTime}
                            onChange={handleLimitChange}
                            placeholder="enter number"
                            className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <div className="relative text-black">
                          <select
                            name="buyTimeFrame"
                            value={limit.buyTimeFrame}
                            onChange={(e) => setLimit({ ...limit, buyTimeFrame: e.target.value })}
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
                  </div>
                )}
              </>
            )}

            <div className="col-span-12">
              <div className="relative col-span-6">
                <div
                  className={`${limit.buyTimeInForce == 'GTT' ? 'cursor-wait opacity-50' : ''} relative text-white form-control`}
                >
                  <label id="buyreduce" className="label justify-start cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      id="buyreduce"
                      checked={limit.buyReduceOnly}
                      disabled={limit.buyTimeInForce == 'GTT'}
                      onChange={(e) => setLimit({ ...limit, buyReduceOnly: !limit.buyReduceOnly })}
                      className="checkbox checkbox-primary"
                    />
                    <span
                      title={`${limit.buyTimeInForce == 'GTT' ? 'This only availabel when Time in Force is set to IOC.' : ''}`}
                    >
                      Reduce Only
                    </span>
                  </label>
                </div>
              </div>
              <div className="relative col-span-6">
                <div
                  className={`${limit.buyTimeInForce == 'IOC' ? 'cursor-wait opacity-50' : ''} relative text-white form-control`}
                >
                  <label htmlFor="buypost" className="label justify-start cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      id="buypost"
                      checked={limit.buyPostOnly}
                      disabled={limit.buyTimeInForce == 'IOC'}
                      onChange={() => setLimit({ ...limit, buyPostOnly: !limit.buyPostOnly })}
                      className="checkbox checkbox-primary"
                    />
                    <span
                      title={`${limit.buyTimeInForce == 'IOC' ? 'This only availabel when Time in Force is set to GTT.' : ''}`}
                    >
                      Post Only
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="relative col-span-12">
              <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
                <span className="py-2 px-3 text-gray-400">Total</span>
                <input
                  type="number"
                  value={limit.buyTotal}
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
                onClick={limitBuy}
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
            <div className="relative col-span-12">
              <div
                onClick={() => focusInput('sellLimitPrice')}
                className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
              >
                <span className="py-2 px-3 text-gray-400 cursor-pointer">Limit Price</span>
                <input
                  ref={(el) => (inputRefs.current.sellLimitPrice = el)}
                  type="number"
                  value={limit.sellLimitPrice}
                  name="sellLimitPrice"
                  placeholder="$0.0"
                  onChange={handleLimitChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">USDT</span>
              </div>
            </div>

            <div className="relative col-span-12">
              <div
                onClick={() => focusInput('sellSize')}
                className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
              >
                <span className="py-2 px-3 text-gray-400 cursor-pointer">Amount</span>
                <input
                  ref={(el) => (inputRefs.current.sellSize = el)}
                  type="number"
                  value={limit.sellSize}
                  placeholder="0.00"
                  name="sellSize"
                  onChange={handleLimitChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">{name && name[0]}</span>
              </div>
            </div>
            {/* <div className="relative col-span-12">
              <div className="relative">
                <input
                  type="range"
                  className="range range-error"
                  value={limit.sellLimitPrice}
                  onChange={handleSellRangeLimit}
                  min={0}
                  max={buyingRange}
                />
              </div>
            </div> */}
            <div className="relative col-span-12">
              <button
                className="w-full px-4 py-2 text-left bg-[#2A2D35] text-white rounded-md flex justify-between items-center"
                onClick={() => setIsOpenSell(!isOpenSell)}
              >
                <span>Advanced Settings</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-300 ${isOpenSell ? '' : 'rotate-180'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
            </div>

            {isOpenSell && (
              <>
                <div className="relative col-span-12">
                  <div className="relative text-black">
                    <select
                      name="timeInForce"
                      value={limit.sellTimeInForce}
                      onChange={(e) => setLimit({ ...limit, sellTimeInForce: e.target.value })}
                      className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                    >
                      <option value="GTT">Good Till Time</option>
                      <option value="IOC">Immediate or Cancel</option>
                    </select>
                  </div>
                </div>
                <div className="relative col-span-12">
                  <div className="grid grid-cols-2 gap-3">
                    {limit.sellTimeInForce == 'GTT' && (
                      <div className="relative">
                        <div className="relative text-black">
                          <input
                            type="number"
                            name="sellTime"
                            value={limit.sellTime}
                            onChange={handleLimitChange}
                            placeholder="enter number"
                            className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                          />
                        </div>
                      </div>
                    )}
                    {limit.sellTimeInForce == 'GTT' && (
                      <div className="relative">
                        <div className="relative text-black">
                          <select
                            name="buytimeinforce"
                            value={limit.sellTimeFrame}
                            onChange={(e) => setLimit({ ...limit, sellTimeFrame: e.target.value })}
                            className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
                          >
                            <option value="minute">Mins</option>
                            <option value="hour">Hours</option>
                            <option value="day">Days</option>
                            <option value="week">Weeks</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="col-span-12">
              <div className="relative col-span-6">
                <div
                  className={`${limit.sellTimeInForce == 'GTT' ? 'cursor-move opacity-50' : ''} relative text-white form-control`}
                >
                  <label htmlFor="sellreduce" className="label justify-start cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      id="sellreduce"
                      checked={limit.sellReduceOnly}
                      disabled={limit.sellTimeInForce == 'GTT'}
                      onChange={(e) =>
                        setLimit({ ...limit, sellReduceOnly: !limit.sellReduceOnly })
                      }
                      className="checkbox checkbox-primary"
                    />
                    <span
                      title={`${limit.buyTimeInForce == 'GTT' ? 'This only availabel when Time in Force is set to IOC.' : ''}`}
                    >
                      Reduce Only
                    </span>
                  </label>
                </div>
              </div>

              <div className="relative col-span-6">
                <div
                  className={`${limit.sellTimeInForce == 'IOC' ? 'cursor-wait opacity-50' : ''} relative text-white form-control`}
                >
                  <label htmlFor="sellpost" className="label justify-start cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      id="sellpost"
                      checked={limit.sellPostOnly}
                      disabled={limit.sellTimeInForce == 'IOC'}
                      onChange={() => setLimit({ ...limit, sellPostOnly: !limit.sellPostOnly })}
                      className="checkbox checkbox-primary"
                    />
                    <span
                      title={`${limit.sellTimeInForce == 'IOC' ? 'This only availabel when Time in Force is set to GTT.' : ''}`}
                    >
                      Post Only
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="relative col-span-12">
              <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
                <span className="py-2 px-3 text-gray-400">Total</span>
                <input
                  type="number"
                  value={limit.sellTotal}
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
                onClick={limitSell}
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

export default Limit
