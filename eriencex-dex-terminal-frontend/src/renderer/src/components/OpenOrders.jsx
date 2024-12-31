import axios from 'axios'
import React, { useState } from 'react'
import { showToast } from '../utils/helper'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'

const OpenOrders = () => {
  const { baseURL, memonic, chainAddress, blockHeight, server, enMemonic } = useSelector(selectData)
  const orderData = useSelector((state) => state.data.openOrderData)

  const [loading, setLoading] = useState(Array(orderData.length).fill(false))
  const [rowOpacity, setRowOpacity] = useState([])

  const formatTimeDifference = (utcTimestamp) => {
    const diff = new Date(utcTimestamp).getTime() - Date.now()
    const minutes = Math.floor(diff / (1000 * 60)) % 60
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes <= 1) {
      return '1m'
    }
    return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const cancelOrder = async (order, index) => {
    setLoading((prevLoading) => {
      const updatedLoading = [...prevLoading]
      updatedLoading[index] = true
      return updatedLoading
    })
    try {
      const res = await axios.post(`${baseURL}api/v1/cancelOrder`, {
        clientId: order.clientId,
        orderFlags: order.orderFlags,
        clobPairId: order.ticker,
        goodTilBlock: order.goodTilBlock,
        goodTilBlockTime: order.goodTilBlockTime,
        memonic: enMemonic,
        network: server
      })
      const data = res.data
      showToast('Order Cancelled Successfully', 'success')
      setRowOpacity((prevOpacity) => ({
        ...prevOpacity,
        [order.id]: 0.5
      }))
    } catch (err) {
      console.log(err)
      showToast(`Error while canceling ${err.message}`, 'error')
    } finally {
      setLoading((prevLoading) => {
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
              <th className="text-xs text-white font-light py-3 px-1">Status</th>
              <th className="text-xs text-white font-light py-3 px-1">Side</th>
              <th className="text-xs text-white font-light py-3 px-1">Amount</th>
              <th className="text-xs text-white font-light py-3 px-1">Price</th>
              <th className="text-xs text-white font-light py-3 px-1">Trigger</th>
              <th className="text-xs text-white font-light py-3 px-1">Margin Mode</th>
              <th className="text-xs text-white font-light py-3 px-1">Good Till</th>
              <th className="text-xs text-white font-light py-3 px-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {orderData.length > 0 ? (
              orderData
                .filter((order) => order.status != 'FILLED')
                .map((order, index) => {
                  const side = order.side == 'BUY'
                  const currentTime = new Date().getTime()
                  const goodTilBlockTime = new Date(order.goodTilBlockTime).getTime()
                  const isExpired = goodTilBlockTime < currentTime

                  if (!isExpired) {
                    return (
                      <tr
                        key={index}
                        style={{
                          opacity: rowOpacity[order.id] || 1,
                          cursor: rowOpacity[order.id] ? 'not-allowed' : 'default'
                        }}
                      >
                        <td>{order.ticker}</td>
                        <td>{order.type}</td>
                        <td className={`${side ? 'primary-color' : 'secondary-color'}`}>
                          {order.side}
                        </td>
                        <td>{order.size}</td>
                        <td>${order.price}</td>
                        <td>${order.price}</td>
                        <td>Cross</td>
                        <td>
                          {order.goodTilBlockTime
                            ? formatTimeDifference(order.goodTilBlockTime)
                            : '-'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="px-4 py-2 bg-transparent text-white border border-1 rounded-xl"
                            onClick={() =>
                              cancelOrder({ ...order, goodTilBlock: blockHeight, memonic }, index)
                            }
                          >
                            {loading[index] ? (
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
                              'X'
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  } else {
                    return null
                  }
                })
            ) : chainAddress === '' ? (
              <tr>
                <td colSpan="10">
                  <div className="w-full h-56 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Please enter your address to fetch this</p>
                  </div>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="10">
                  <div className="w-full h-56 flex items-center justify-center">
                    <p className="text-xs text-gray-400">You have no open orders.</p>
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

export default OpenOrders
