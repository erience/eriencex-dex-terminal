import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import loading from '../assets/loading.gif'
import { formatPairName, formatWithCommas, showToast } from '../utils/helper.js'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectData,
  setCryptoPair,
  setPair,
  setTickerDecimals
} from '../redux-toolkit/dataSlice.js'
import Banner from '../assets/Banner.png'

const CryptoInfo = () => {
  const { pair, webSocketURL, cryptoPair, tradesData, server, tickerDecimals } =
    useSelector(selectData)

  const name = useMemo(() => formatPairName(pair)?.split('-'), [pair])
  const [coinData, setCoinData] = useState([])
  const [volume24h, setVolume24h] = useState(0)
  const [trades24, setTrades24h] = useState(0)
  const [fundingRate, setFundingRate] = useState(0)
  const [openInterest, setOpenInterest] = useState(0)
  const [oraclePrice, setOraclePrice] = useState(0)
  const [showPairs, setShowPairs] = useState(false)
  const [search, setSearch] = useState('')
  const dataRef = useRef(null)
  const webSocketRef = useRef(null)
  const wsReconnectRef = useRef()
  const searchInputRef = useRef()
  const dispatch = useDispatch()

  const handlePairs = () => setShowPairs((prev) => !prev)

  const filteredCryptoPair = useMemo(
    () => cryptoPair.filter((pair) => pair?.ticker.toLowerCase().includes(search.toLowerCase())),
    [cryptoPair, search]
  )

  useEffect(() => {
    dataRef.current = coinData
  }, [coinData])

  useEffect(() => {
    if (showPairs && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showPairs])

  const changePair = useCallback(
    (newPair) => {
      if (newPair !== pair) {
        dispatch(setPair(newPair))
        setShowPairs(false)
        setSearch('')
        dispatch(setCryptoPair({ actionType: 'replace', data: [] }))
      } else {
        setShowPairs(false)
      }
    },
    [pair]
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredCryptoPair.length > 0) {
      changePair(filteredCryptoPair[0].ticker)
    }
  }

  const getCoinInfo = useCallback(() => {
    try {
      const webSocket = new WebSocket(webSocketURL)
      webSocketRef.current = webSocket

      webSocket.onopen = () => {
        webSocket.send(JSON.stringify({ type: 'subscribe', channel: 'v4_markets' }))
        if (wsReconnectRef.current) {
          clearTimeout(wsReconnectRef.current)
        }
        setCoinData([])
        dispatch(setCryptoPair({ actionType: 'replace', data: [] }))
      }

      webSocket.onmessage = (event) => {
        const responseData = JSON.parse(event.data)

        if (responseData?.contents?.markets) {
          const markets = Object.values(responseData.contents.markets)
          const activeMarkets = markets?.filter((market) => market.status.toLowerCase() == 'active')

          setCoinData((prev) => [...activeMarkets, ...prev])

          const marketIndex = activeMarkets.findIndex((market) => market.ticker === pair)

          if (marketIndex !== -1) {
            const newObj = activeMarkets[marketIndex]
            setOraclePrice(parseFloat(newObj?.oraclePrice))
            setFundingRate(parseFloat(newObj?.nextFundingRate) * 100)
            setOpenInterest(parseFloat(newObj?.openInterest))
            setVolume24h(parseFloat(newObj?.volume24H).toFixed(0))
            setTrades24h(newObj?.trades24H)
          }

          dispatch(setCryptoPair({ actionType: 'append', data: activeMarkets }))

          const decimalPlacesObj = {}
          activeMarkets.forEach((pair) => {
            const decimalCount = -Math.floor(Math.log10(pair?.tickSize) || 0)
            decimalPlacesObj[pair.ticker] = decimalCount
          })
          dispatch(setTickerDecimals(decimalPlacesObj))
        }

        if (responseData?.contents?.oraclePrices) {
          const oraclePrices = responseData.contents.oraclePrices
          if (oraclePrices[pair]) {
            const updatedPrice = parseFloat(oraclePrices[pair].oraclePrice)
            setOraclePrice(updatedPrice)

            const updatedCoinData = dataRef.current.map((item) =>
              item.ticker === pair ? { ...item, oraclePrice: updatedPrice } : item
            )
            dispatch(setCryptoPair({ actionType: 'replace', data: updatedCoinData }))
          }
        }

        if (responseData?.contents?.trading) {
          const tradingData = responseData.contents.trading[pair]

          if (tradingData) {
            if (tradingData?.openInterest) {
              setOpenInterest(parseFloat(tradingData?.openInterest))
            }
            if (tradingData?.nextFundingRate) {
              setFundingRate(parseFloat(tradingData?.nextFundingRate) * 100)
            }
            if (tradingData?.trades24H) setTrades24h(tradingData?.trades24H)
            if (tradingData?.volume24H) {
              setVolume24h(parseFloat(tradingData?.volume24H).toFixed(0))
            }
          }
        }
      }

      webSocket.onerror = (event) => console.error('WebSocket encountered error:', event)
      webSocket.onclose = () => {
        console.error('Websocket connection closed')
        wsReconnectRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...')
          getCoinInfo()
        }, 1000)
      }

      return () => {
        if (wsReconnectRef.current) {
          clearTimeout(wsReconnectRef.current)
        }
        webSocket.close()
      }
    } catch (error) {
      console.error('WebSocket error:', error)
    }
  }, [webSocketURL, pair])

  useEffect(() => {
    getCoinInfo()
    return () => {
      if (webSocketRef?.current) {
        webSocketRef?.current?.close()
      }
      if (wsReconnectRef.current) {
        clearTimeout(wsReconnectRef.current)
      }
    }
  }, [getCoinInfo, pair, webSocketURL, server])

  const formatNumber = useCallback((num) => {
    const parsedNum = parseFloat(num)
    if (parsedNum >= 1e9) return (parsedNum / 1e9).toFixed(1) + 'b'
    if (parsedNum >= 1e6) return (parsedNum / 1e6).toFixed(1) + 'm'
    if (parsedNum >= 1e3) return (parsedNum / 1e3).toFixed(1) + 'k'
    return parsedNum
  }, [])

  useEffect(() => {
    if (tradesData.length > 0) {
      document.title = `$${formatWithCommas(tradesData[0].price, tickerDecimals[pair])} ${pair} dYdX`
    }
  }, [tradesData, pair])

  return (
    <div className="relative col-span-12 py-3 border-b border-gray-700">
      <div className="container">
        <div className="flex flex-col xxl:flex-row items-center justify-between gap-x-10 gap-y-5 text-center">
          <div className="flex flex-col xxl:flex-row items-center gap-x-4 gap-y-5 text-left">
            <div className="relative">
              <h3 className="text-lg cursor-pointer" onClick={handlePairs}>
                {formatPairName(pair)}
              </h3>
              {showPairs && (
                <div className="absolute border border-light-gray bg-semi-dark top-[46px] -left-4 z-50 w-[800px] h-full min-h-[600px] overflow-y-auto vertical-thin">
                  <div
                    className="fixed left-0 top-0 w-full h-full backdrop-blur-sm bg-black opacity-50 -z-10"
                    onClick={handlePairs}
                  ></div>
                  <div className="sticky top-0 bg-semi-dark px-3 py-5 z-20">
                    <div className="relative w-full h-8 rounded-md flex items-center overflow-hidden bg-semi-dark text-gray-400">
                      <span className="flex items-center justify-center w-8 h-8">
                        <FaMagnifyingGlass />
                      </span>
                      <input
                        type="text"
                        ref={searchInputRef}
                        name="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search"
                        className="w-full h-full p-2 border-0 outline-none bg-transparent font-light"
                      />
                    </div>
                  </div>
                  <table className="table w-full whitespace-nowrap text-left align-middle">
                    <thead>
                      <tr className="sticky z-10 top-16 border-b bg-semi-dark border-gray-800">
                        <th className="text-xs text-white font-light py-3 px-1">Market</th>
                        <th className="text-xs text-white font-light py-3 px-1">Price</th>
                        <th className="text-xs text-white font-light py-3 px-1">24H</th>
                        <th className="text-xs text-white font-light py-3 px-1">Volume</th>
                        <th className="text-xs text-white font-light py-3 px-1">Open Interest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoPair.length > 0 ? (
                        filteredCryptoPair.length > 0 ? (
                          filteredCryptoPair.map((pair, i) => {
                            const per = ((pair.priceChange24H * 100) / pair.oraclePrice).toFixed(2)
                            const decimalPlaces = Math.max(
                              0,
                              Math.round(-Math.log10(pair?.tickSize || 1))
                            )
                            const price = parseFloat(pair.oraclePrice)
                            return (
                              <tr
                                key={i}
                                className="cursor-pointer hover:bg-dark border-b border-gray-800"
                                onClick={() => changePair(pair.ticker)}
                              >
                                <td>{formatPairName(pair.ticker)}</td>
                                <td>${formatWithCommas(price, decimalPlaces)}</td>
                                <td
                                  className={`relative ${per > 0 ? 'primary-color' : 'secondary-color'}`}
                                >
                                  {per < 0 && <span className="absolute left-2">-</span>}
                                  {Math.abs(per)}%
                                </td>
                                <td>${formatNumber(pair.volume24H)}</td>
                                <td>{formatNumber(pair.openInterest)}</td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan={5}>No pair found</td>
                          </tr>
                        )
                      ) : (
                        <tr>
                          <td colSpan={5}>
                            <div className="flex items-center justify-center h-96">
                              <img src={loading} alt="loading" width={50} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="block w-full h-1 xxl:w-1 xxl:h-10 border-b xxl:border-r border-gray-700"></div>
            {tradesData.length > 0 ? (
              <div className="relative">
                <h3
                  className={`text-base ${tradesData[0].side === 'BUY' ? 'primary-color' : 'secondary-color'}`}
                >
                  ${formatWithCommas(tradesData[0].price, tickerDecimals && tickerDecimals[pair])}
                </h3>
              </div>
            ) : (
              <div className="relative animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-24"></div>
              </div>
            )}
            <div className="relative">
              <h3 className="text-gray-400 text-xs">Oracle Price</h3>
              <p className="text-xs font-light text-right">
                ${formatWithCommas(oraclePrice, tickerDecimals && tickerDecimals[pair])}
              </p>
            </div>
            <div className="relative">
              <h3 className="text-gray-400 text-xs">24h Volume</h3>
              <p className="text-xs font-light text-white text-right">
                ${formatWithCommas(volume24h)}
              </p>
            </div>
            <div className="relative">
              <h3 className="text-gray-400 text-xs">24h Trades</h3>
              <p className="text-xs font-light text-white text-right">
                {formatWithCommas(trades24)}
              </p>
            </div>
            <div className="relative">
              <h3 className="text-gray-400 text-xs">Open Interest</h3>
              <p className="text-xs font-light text-white text-right">
                {formatWithCommas(openInterest, 2)} {name && name[0]}
              </p>
            </div>
            <div className="relative">
              <h3 className="text-gray-400 text-xs">1h Funding Rate</h3>
              <p
                className={`text-xs font-light text-right ${fundingRate > 0 ? 'primary-color' : 'secondary-color'
                  }`}
              >
                {formatWithCommas(fundingRate, 6)}%
              </p>
            </div>
          </div>
          <div className=''>
            <img src={Banner} alt="AdBanner" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CryptoInfo
