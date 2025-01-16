import React, { useEffect, useMemo, useRef, useState } from 'react'
import loading_gif from '../assets/loading.gif'
import { formatPairName, formatWithCommas } from '../utils/helper'
import { selectData, setTradesData } from '../redux-toolkit/dataSlice'
import { useDispatch, useSelector } from 'react-redux'

const MarketTrades = () => {
  const { pair, webSocketURL, tradesData, tickerDecimals, cryptoPair } = useSelector(selectData)
  const webSocketRef = useRef(null)
  const [tickerStepSizes, setTickerStepSizes] = useState({})
  const dispatch = useDispatch()

  const volumes = useMemo(
    () => tradesData?.map((trade) => trade.price * parseFloat(trade.size)) || [],
    [tradesData]
  )

  const getStepSize = () => {
    if (cryptoPair) {
      const tickerInfo = cryptoPair.filter((pairData) => pairData.ticker == pair)
      return parseFloat(tickerInfo[0]?.stepSize)
    }
  }

  const maxVolume = useMemo(() => Math.max(...volumes), [volumes])

  const name = pair && formatPairName(pair)?.split('-')
  const reconnectTimeoutRef = useRef(null)

  const getTrades = async () => {
    try {
      const webSocket = new WebSocket(webSocketURL)
      webSocketRef.current = webSocket
      let closing = false
      webSocket.onopen = function (event) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        const params = {
          type: 'subscribe',
          channel: 'v4_trades',
          id: pair
        }
        dispatch(setTradesData({ actionType: 'replace', data: [] }))
        webSocket.send(JSON.stringify(params))
      }

      webSocket.onmessage = function (event) {
        const responseData = JSON.parse(event.data)
        // if (responseData?.id && pair != responseData.id) {
        //   closing = true
        //   webSocket.close()
        // }
        if (responseData?.id && pair == responseData?.id) {
          if (responseData.channel === 'v4_trades') {
            const trades = responseData.contents
            dispatch(setTradesData({ actionType: 'append', data: trades?.trades }))
          }
        } else if (responseData?.id) {
          const params = {
            type: 'unsubscribe',
            channel: 'v4_trades',
            id: responseData?.id
          }
          webSocket.send(JSON.stringify(params))
        }
      }

      webSocket.onerror = function (event) {
        console.error('WebSocket encountered error:', event)
      }

      webSocket.onclose = function (event) {
        console.log('MarketTrades WebSocket connection closed.')
        if (closing == false) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('orderbook Attempting to reconnect WebSocket...')
            getTrades()
          }, 2000)
        }
      }
    } catch (error) {
      console.log('Error in trades websocket', error)
    }
  }

  useEffect(() => {
    getTrades()
    return () => {
      if (webSocketRef.current) {
        webSocketRef?.current?.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [pair, webSocketURL])

  return (
    <>
      <div className="relative pt-3 pb-5 px-1 pl-2">
        <div className="relative flex items-center gap-x-3 mb-3">
          <button type="button" className="primary-color">
            Market Trades
          </button>
        </div>
        <div className="relative w-full max-h-[420px] overflow-auto vertical-thin">
          <table className="w-full text-left align-middle">
            <thead>
              <tr className="w-full h-11 z-10 sticky top-0 bg-dark">
                <th className="text-xs font-light w-1/3">Price(USDT)</th>
                <th className="text-xs text-right font-light w-1/3">Amount({name && name[0]})</th>
                <th className="text-xs text-right font-light w-1/3">Time</th>
              </tr>
            </thead>
            <tbody>
              {tradesData?.length > 0 ? (
                tradesData.map((trade, i) => {
                  const time = new Date(trade.createdAt)
                  const formattedTime = time.toLocaleTimeString()
                  const buy = trade.side === 'BUY'
                  const size = parseFloat(trade.size)
                  const volume = trade.price * size
                  const stepSize = getStepSize()
                  const stepDecimals = stepSize?.toString().split('.')[1]?.length || 0
                  const normalizedVolume = maxVolume ? (volume / maxVolume) * 100 : 0
                  return (
                    <tr key={i} className="relative my-1 w-full">
                      <td className={`text-xs w-1/3 ${buy ? 'primary-color' : 'secondary-color'} `}>
                        <span>{formatWithCommas(trade.price, tickerDecimals[pair])}</span>
                      </td>
                      <td className="text-xs text-right w-1/3 text-gray-400">
                        <span>{formatWithCommas(size, stepDecimals)}</span>
                      </td>
                      <td className="text-xs text-right w-1/3 text-gray-400">
                        <span>{formattedTime}</span>
                      </td>
                      <td
                        className="absolute inset-0 h-full"
                        style={{
                          background: `${buy
                            ? `linear-gradient(to left, rgba(17, 231, 176, 0.3) ${normalizedVolume}%, transparent ${normalizedVolume}%)`
                            : `linear-gradient(to left, rgba(235, 64, 52, 0.3) ${normalizedVolume}%, transparent ${normalizedVolume}%)`
                            }`
                        }}
                      ></td>
                    </tr>
                  )
                })
              ) : (
                <>
                  <tr>
                    <td colSpan={4}>
                      <div className="flex items-center justify-center h-48">
                        <img src={loading_gif} alt="loading gif" width={50} />
                      </div>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default MarketTrades
