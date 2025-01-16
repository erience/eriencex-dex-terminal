import React, { useEffect, useRef, useState } from 'react'
import filterOne from '../assets/images/icons/filter-one.svg'
import filterTwo from '../assets/images/icons/filter-two.svg'
import filterThree from '../assets/images/icons/filter-three.svg'
import { FaArrowDownLong, FaArrowUpLong } from 'react-icons/fa6'
import loading from '../assets/loading.gif'
import { formatWithCommas } from '../utils/helper'
import { useDispatch, useSelector } from 'react-redux'
import { selectData, setPairTickSize } from '../redux-toolkit/dataSlice'

const Loading = () => (
  <div className="flex items-center justify-center h-48">
    <img src={loading} alt="loading" width={50} />
  </div>
)

const Table = ({ data, isBid, name, getStepSize, pairTickSize }) => (
  <div className="relative w-full max-h-[420px] overflow-auto vertical-thin">
    <table className="w-full text-left align-middle">
      <thead>
        <tr className="w-full h-11 sticky top-0 bg-dark">
          <th className="text-xs font-light">Price(USD)</th>
          <th className="text-xs text-right font-light">Amount({name && name[0]})</th>
          <th className="text-xs text-right font-light">Total({name && name[0]})</th>
        </tr>
      </thead>
      <tbody>
        {data?.length > 0 ? (
          [...data]
            .sort((a, b) => b.price - a.price)
            .map((order, index) => {
              const total = parseFloat(order.size) * parseFloat(order.price)
              const size = parseFloat(order.size)
              const price = parseFloat(order.price)
              const stepSize = getStepSize()
              const stepDecimals = stepSize.toString().split('.')[1]?.length || 0
              return (
                <tr key={index}>
                  <td className={`text-xs ${isBid ? 'primary-color' : 'secondary-color'} w-1/3`}>
                    <span>{formatWithCommas(price, pairTickSize)}</span>
                  </td>
                  <td className="text-xs text-right text-gray-400 w-1/3">
                    <span>{formatWithCommas(size, stepDecimals)}</span>
                  </td>
                  <td className="text-xs text-right text-gray-400 w-1/3">
                    <span>{formatWithCommas(total, stepDecimals)}</span>
                  </td>
                </tr>
              )
            })
        ) : (
          <tr>
            <td colSpan={3}>
              <Loading />
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)

const OrderBook = () => {
  const [orderBids, setOrderBids] = useState([])
  const [orderAsks, setOrderAsks] = useState([])
  const [index, setIndex] = useState(0)
  const [spread, setSpread] = useState(0)
  const [decimalCount, setDecimalCount] = useState(false)
  const dropdownRef = useRef(null)
  const webSocketRef = useRef(null)
  const counter = useRef(null)
  const dispatch = useDispatch()
  const lastOrderBidsRef = useRef([])
  const lastOrderAsksRef = useRef([])
  const [decimalValues, setDecimalValues] = useState([
    { value: 0.0001, decimal: 4 },
    { value: 0.001, decimal: 3 },
    { value: 0.01, decimal: 2 },
    { value: 0.1, decimal: 1 }
  ])

  const {
    pair,
    webSocketURL,
    tradesData,
    server,
    pairTickSize,
    tickerDecimals,
    cryptoPair
  } = useSelector(selectData)
  const name = pair && pair?.split('-')
  // const decimalValues = [
  //   { value: 0.0001, decimal: 4 },
  //   { value: 0.001, decimal: 3 },
  //   { value: 0.01, decimal: 2 },
  //   { value: 0.1, decimal: 1 }
  // ]
  const reconnectTimeoutRef = useRef(null)
  useEffect(() => {
    if (tickerDecimals && pair && tickerDecimals[pair] !== undefined) {
      const baseDecimal = tickerDecimals[pair];

      const updatedDecimalValues = Array.from({ length: 4 }, (_, i) => {
        const decimal = baseDecimal - i;
        const value = (Math.pow(10, -decimal)).toFixed(Math.abs(decimal)); // Force fixed-point format
        return { value, decimal }; // `value` is now a string in fixed-point notation
      }).filter(item => parseFloat(item.value) <= 1); // Convert back to number for comparison

      if (updatedDecimalValues.length > 0) {
        dispatch(setPairTickSize(updatedDecimalValues[0].decimal));
      }

      setDecimalValues(updatedDecimalValues);
      // console.log({ updatedDecimalValues });
    }
  }, [tickerDecimals, pair]);

  const updateOrderList = (orders, newOrder) => {
    const existingIndex = orders.findIndex((o) => o.price == newOrder.price)

    if (existingIndex !== -1) {
      orders[existingIndex].size = newOrder.size
      return [...orders]
    } else {
      const updatedOrders = [newOrder, ...orders]
      return updatedOrders.slice(0, 20).filter((o) => o.size != 0)
    }
  }

  // websocket function to get orderBook data
  const connectWebSocket = async () => {
    try {
      const webSocket = new WebSocket(webSocketURL)
      let closing = false
      webSocketRef.current = webSocket

      webSocket.onopen = function (event) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        setOrderAsks([])
        setOrderBids([])
        lastOrderBidsRef.current = []
        lastOrderAsksRef.current = []
        const params = {
          type: 'subscribe',
          channel: 'v4_orderbook',
          id: pair
        }

        if (webSocket.readyState == webSocket.OPEN) {
          webSocket.send(JSON.stringify(params))
        }
      }
      webSocket.onmessage = function (event) {
        const responseData = JSON.parse(event.data)
        // if (responseData?.id && pair != responseData.id) {
        //   closing = true
        //   webSocket.close()
        // }
        if (responseData?.id && pair == responseData?.id) {
          if (responseData.channel === 'v4_orderbook') {
            const order = responseData.contents
            // console.log('orderBooks', order, responseData)

            if (responseData?.message_id % 200 == 0) {
              counter.current = counter.current + 1
            }
            if (responseData?.type === "subscribed") {

              if (Object.keys(order).includes('asks') && Object.keys(order).includes('bids')) {
                const asks = order.asks
                  .map((ask) => ({ price: ask.price, size: ask.size }))
                  .filter((ask) => ask.size != 0)
                const bids = order.bids
                  .map((bid) => ({ price: bid.price, size: bid.size }))
                  .filter((bid) => bid.size != 0)

                setOrderAsks(asks.slice(0, 20))
                setOrderBids(bids.slice(0, 20))
                lastOrderAsksRef.current = asks.slice(0, 20)
                lastOrderBidsRef.current = bids.slice(0, 20)
              }
            }

            // if (Object.keys(order).includes('bids')) {
            //   const bids = order['bids'][0]
            //   order.bids[0][1] &&
            //     order.bids[0][1] != 0 &&
            //     setOrderBids((prev) => {
            //       const newBid = { price: bids[0], size: bids[1] }
            //       const updatedBids = [newBid, ...prev]
            //       const latestBids = updatedBids.slice(0, 20).filter((bids) => bids.size != 0)
            //       return latestBids
            //     })
            // }
            if (Object.keys(order).includes('bids')) {
              const bids = order['bids'][0]
              // console.log("Bids in orderbook", bids)
              if (bids[1] && bids[1] != 0) {
                const newBid = { price: bids[0], size: bids[1] }
                const updatedBids = updateOrderList(lastOrderBidsRef.current, newBid)
                if (JSON.stringify(updatedBids) !== JSON.stringify(lastOrderBidsRef.current)) {
                  lastOrderBidsRef.current = updatedBids
                  setOrderBids(updatedBids)
                }
              }
            }

            // if (Object.keys(order).includes('asks')) {
            //   const asks = order['asks'][0]
            //   asks[1] &&
            //     asks[1] != 0 &&
            //     setOrderAsks((prev) => {
            //       const newAsk = { price: asks[0], size: asks[1] }
            //       const updatedAsks = [newAsk, ...prev]
            //       const latestAsks = updatedAsks.slice(0, 20).filter((asks) => asks.size != 0)
            //       return latestAsks
            //     })
            // }
            if (Object.keys(order).includes('asks')) {
              const asks = order['asks'][0]
              // console.log("Asks in orderbook", asks)
              if (asks[1] && asks[1] != 0) {
                const newAsk = { price: asks[0], size: asks[1] }
                const updatedAsks = updateOrderList(lastOrderAsksRef.current, newAsk)
                if (JSON.stringify(updatedAsks) !== JSON.stringify(lastOrderAsksRef.current)) {
                  lastOrderAsksRef.current = updatedAsks
                  setOrderAsks(updatedAsks)
                }
              }
            }
          }
        } else if (responseData?.id) {
          const params = {
            type: 'unsubscribe',
            channel: 'v4_orderbook',
            id: responseData?.id
          }

          if (webSocket.readyState == webSocket.OPEN) {
            webSocket.send(JSON.stringify(params))
          }
        }
      }

      webSocket.onerror = function (event) {
        console.error('WebSocket encountered error:', event)
      }

      webSocket.onclose = function (event) {
        console.log('OrderBook WebSocket connection closed.')
        if (closing == false) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('orderbook Attempting to reconnect WebSocket...')
            connectWebSocket()
          }, 2000)
        }
      }
    } catch (error) {
      console.error('OrderBook WebSocket error:', error)
    }
  }

  useEffect(() => {
    connectWebSocket()
    return () => {
      if (webSocketRef?.current) {
        webSocketRef?.current?.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [pair, webSocketURL, server])

  const getStepSize = () => {
    if (cryptoPair) {
      const tickerInfo = cryptoPair.filter((pairData) => pairData.ticker == pair)
      return parseFloat(tickerInfo[0]?.stepSize)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDecimalCount(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function highestPrice(arr) {
    if (arr.length === 0) return null
    let highestPrice = -Infinity
    arr.forEach((item) => {
      if (parseFloat(item.price) > highestPrice) {
        highestPrice = parseFloat(item.price)
      }
    })
    return highestPrice
  }

  function lowestPrice(arr) {
    if (arr.length === 0) return null
    let lowPrice = Infinity
    arr.forEach((item) => {
      if (parseFloat(item.price) < lowPrice) {
        lowPrice = parseFloat(item.price)
      }
    })
    return lowPrice
  }

  const calculateSpread = (orderAsks, orderBids) => {
    if (orderAsks.length > 0 && orderBids.length > 0) {
      const lowestAsk = lowestPrice(orderAsks)
      const highestBid = highestPrice(orderBids)
      let spread = (lowestAsk - highestBid) / 100
      setSpread(Math.abs(spread))
    }
  }

  const handleTickSize = (data) => {
    dispatch(setPairTickSize(data.decimal))
    setDecimalCount(false)
  }

  useEffect(() => {
    calculateSpread(orderAsks, orderBids)
  }, [orderAsks, orderBids])

  const handleChange = (index) => {
    setIndex(index)
  }

  const renderTradeInfo = () =>
    tradesData.slice(0, 1).map((trade, index) => {
      const buy = trade.side === 'BUY'
      return (
        <h4
          key={index}
          className={`${buy ? 'primary-color' : 'secondary-color'} text-lg font-bold flex items-center gap-1`}
        >
          ${formatWithCommas(trade.price, tickerDecimals[pair])}
          {buy ? <FaArrowUpLong size={15} /> : <FaArrowDownLong size={15} />}
        </h4>
      )
    })


  const generateSubString = (value) => {
    const strValue = value.toString();
    if (strValue.startsWith("0.")) {
      const fractionalPart = strValue.slice(2);
      const leadingZeros = fractionalPart.match(/^0+/)?.[0]?.length || 0;

      if (leadingZeros > 3) {
        const remainingValue = fractionalPart.slice(leadingZeros);
        return (
          <>
            0.0<sub className='px-[0.5px]'>{leadingZeros - 1}</sub>{remainingValue}
          </>
        );
      }
    }
    return strValue;
  };

  return (
    <>
      <div className="relative w-full">
        <div className="relative w-full pt-0 pb-5 px-1 pl-2 h-full">
          <div className="relative py-3">
            <div className="relative flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="relative w-full flex items-center justify-between flex-wrap gap-x-1">
                <div>
                  {[filterOne, filterTwo, filterThree].map((filter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="inline-block w-6 h-6"
                      onClick={() => handleChange(idx)}
                    >
                      <img
                        src={filter}
                        alt={`filter ${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <h6
                    onClick={() => setDecimalCount(!decimalCount)}
                    className="cursor-pointer text-md font-semibold"
                  >
                    TickSize
                  </h6>
                  {decimalCount && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-10 right-0 mt-2 p-1 w-32 bg-zinc-700 shadow-lg rounded-md border border-zinc-800"
                    >
                      <ul className="space-y-1">
                        {decimalValues.map((data, index) => (
                          <li
                            key={index}
                            className={`text-xs text-white hover:text-zinc-200 hover:bg-zinc-600 p-1.5 cursor-pointer rounded-md ${data.decimal == pairTickSize ? 'bg-zinc-600' : ''}`}
                            onClick={() => handleTickSize(data)}
                          >
                            {generateSubString(data.value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {index === 0 && (
              <>
                <Table
                  data={orderAsks}
                  name={name}
                  getStepSize={getStepSize}
                  pairTickSize={pairTickSize}
                />
                <div className="relative py-3">
                  <div className="relative flex items-center flex-wrap my-2">
                    <div className="relative flex items-center flex-wrap gap-2 w-[200px]">
                      {renderTradeInfo()}
                    </div>
                    <div className="flex items-center gap-2 w-[100px]">
                      <h3 className="text-xs">Spread</h3>
                      <h3 className="text-xs">{formatWithCommas(spread, 2)}%</h3>
                    </div>
                  </div>
                  <Table
                    data={orderBids}
                    isBid
                    name={name}
                    getStepSize={getStepSize}
                    pairTickSize={pairTickSize}
                  />
                </div>
              </>
            )}

            {index === 1 && (
              <Table
                data={orderBids}
                isBid
                name={name}
                getStepSize={getStepSize}
                pairTickSize={pairTickSize}
              />
            )}

            {index === 2 && (
              <Table
                data={orderAsks}
                name={name}
                getStepSize={getStepSize}
                pairTickSize={pairTickSize}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default OrderBook
