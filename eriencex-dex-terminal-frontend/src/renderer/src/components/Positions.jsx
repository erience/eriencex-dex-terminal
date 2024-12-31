import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { formatWithCommas, showToast } from '../utils/helper'
import { useDispatch, useSelector } from 'react-redux'
import { selectData, setCryptoPair } from '../redux-toolkit/dataSlice'

const Positions = ({ positionData }) => {
  const {
    chainAddress,
    cryptoPair,
    server,
    baseURL,
    enMemonic,
    setPair,
    userEquity,
    pair,
    tickerDecimals
  } = useSelector(selectData)

  const [sellLoading, setSellLoading] = useState(Array(positionData.length).fill(false))
  const dispatch = useDispatch()

  const getPairPrice = (pair) => {
    try {
      const obj = cryptoPair.filter((market) => market.ticker == pair)
      if (obj[0]?.oraclePrice) {
        return formatWithCommas(obj[0]?.oraclePrice, tickerDecimals[pair])
        // return parseFloat(obj[0]?.oraclePrice)
      }
    } catch (err) {
      console.log('error getting price', err)
    }
  }

  const getMaintenanceMargin = (pair) => {
    try {
      const obj = cryptoPair.filter((market) => market.ticker == pair)
      if (obj[0]?.maintenanceMarginFraction) {
        return parseFloat(obj[0]?.maintenanceMarginFraction)
      }
    } catch (error) {
      console.log('Error getting maintenance margin', error)
    }
  }

  const getLiquidationPrice = (position, currentPrice, marginFraction) => {
    try {
      const size = parseFloat(position.size)
      const equity = userEquity
      const notionValue = Math.abs(size) * currentPrice

      if (position.side === 'LONG') {
        const liquidationPrice = (equity - size * currentPrice) / (size * (marginFraction - 1))
        if (liquidationPrice > 0) {
          return liquidationPrice.toFixed(2)
        } else {
          return 0
        }
      } else if (position.side === 'SHORT') {
        const liquidationPrice =
          (equity + Math.abs(size) * currentPrice) / (Math.abs(size) * (marginFraction + 1))
        if (liquidationPrice > 0) {
          return liquidationPrice.toFixed(2)
        } else {
          return 0
        }
      } else {
        return 0
      }
    } catch (error) {
      console.error('Error getting liquidation price', error)
      return 0
    }
  }

  const handleMarket = (ticker) => {
    if (ticker !== pair) {
      setPair(ticker)
      dispatch(setCryptoPair([]))
    }
  }

  const closePosition = async (position, index) => {
    setSellLoading((prevLoading) => {
      const updatedLoading = [...prevLoading]
      updatedLoading[index] = true
      return updatedLoading
    })
    try {
      const res = await axios.post(`${baseURL}api/v1/order`, {
        pair: position.market,
        size: Math.abs(position.size),
        side: `${position.size > 0 ? 'sell' : 'buy'}`,
        memonic: enMemonic,
        reduceOnly: true,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')
    } catch (error) {
      console.error('Error closing position:', error)
      showToast(`Error closing position: ${err.message}`, 'error')
    } finally {
      setSellLoading((prevLoading) => {
        const updatedLoading = [...prevLoading]
        updatedLoading[index] = false
        return updatedLoading
      })
    }
  }

  return (
    <>
      <div className="relative w-full h-60 overflow-x-auto vertical-thin">
        <table className="table w-full whitespace-nowrap text-left align-middle">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-xs text-white font-light py-3 px-1">Market</th>
              <th className="text-xs text-white font-light py-3 px-1">Size</th>
              <th className="text-xs text-white font-light py-3 px-1">Value</th>
              <th className="text-xs text-white font-light py-3 px-1">Unrealized P&L</th>
              <th className="text-xs text-white font-light py-3 px-1">Realized P&L</th>
              <th className="text-xs text-white font-light py-3 px-1">Funding</th>
              <th className="text-xs text-white font-light py-3 px-1">Open</th>
              <th className="text-xs text-white font-light py-3 px-1">Oracle</th>
              <th className="text-xs text-white font-light py-3 px-1">Liquidation</th>
              <th className="text-xs text-white font-light py-3 px-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {positionData.length > 0 ? (
              positionData
                .sort((a, b) => a.market.localeCompare(b.market))
                .map((position, i) => {
                  const size = position.size > 0
                  const oraclePrice = getPairPrice(position.market)
                  const maintenanceMargin = getMaintenanceMargin(position.market)
                  const liquidationPrice = getLiquidationPrice(
                    position,
                    oraclePrice,
                    maintenanceMargin
                  )
                  let value = parseFloat(position.size) * oraclePrice
                  let realizedPnl = parseFloat(position.realizedPnl).toFixed(3)
                  let netFunding = parseFloat(position.netFunding).toFixed(3)
                  let entryPrice = parseFloat(position.entryPrice).toFixed(1)
                  const name = position.market.split('-')
                  const isLong = position.side === 'LONG'

                  let unrealizedPnl = isLong
                    ? (oraclePrice - parseFloat(position.entryPrice)) * Math.abs(position.size)
                    : (parseFloat(position.entryPrice) - oraclePrice) * Math.abs(position.size)

                  unrealizedPnl = isNaN(unrealizedPnl) ? '0' : unrealizedPnl.toFixed(3)

                  return (
                    <tr key={i} className="cursor-pointer">
                      <td onClick={() => handleMarket(position.market)}>{position.market}</td>
                      <td className={`${size ? 'primary-color' : 'secondary-color'}`}>
                        {position.size}
                        <span className="inline-block bg-gray-700 text-white px-1 py-[1px] rounded-md text-xxs font-semibold tracking-wide uppercase">
                          {name[0]}
                        </span>
                      </td>
                      <td>${value.toFixed(3)}</td>
                      <td className={`${unrealizedPnl > 0 ? 'primary-color' : 'secondary-color'}`}>
                        ${unrealizedPnl}
                      </td>
                      <td className={`${realizedPnl > 0 ? 'primary-color' : 'secondary-color'}`}>
                        ${realizedPnl}
                      </td>
                      <td className={`${netFunding > 0 ? 'primary-color' : 'secondary-color'}`}>
                        ${netFunding}
                      </td>
                      <td>${entryPrice}</td>
                      <td>${oraclePrice}</td>
                      <td>{liquidationPrice == 0 ? '-' : `$${liquidationPrice}`}</td>
                      <td>
                        <button
                          type="button"
                          className="px-2 py-2 bg-transparent text-white border border-1 rounded-xl w-11"
                          onClick={(e) => closePosition(position, i)}
                          disabled={sellLoading[i]}
                        >
                          {sellLoading[i] ? (
                            <svg
                              className="animate-spin h-5 w-5 text-white"
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
                          ) : (
                            <span className="h-5 w-5">X</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })
            ) : (
              <tr>
                <td colSpan="10">
                  <div className="w-full h-56 flex items-center justify-center">
                    <p className="text-xs text-gray-400">
                      {chainAddress
                        ? 'You have no positions.'
                        : 'Please enter your address to fetch this'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Positions
