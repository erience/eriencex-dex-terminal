import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'

const OrderHistory = ({ orderHistory, setOrderHistory }) => {
  const { chainAddress, API } = useSelector(selectData)

  const formatTimeDifference = (utcTimestamp) => {
    const diff = Date.now() - new Date(utcTimestamp).getTime()

    const minutes = Math.floor(diff / (1000 * 60)) % 60
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (diff < 1000 * 60) {
      return 'now'
    }
    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const getData = async () => {
    try {
      if (chainAddress) {
        const res = await axios.get(
          `${API}/fills?address=${chainAddress}&subaccountNumber=0&limit=10`
        )
        const data = await res.data
        if (orderHistory.length == 0) {
          setOrderHistory(data.fills)
        } else {
          setOrderHistory([...orderHistory, ...data.fills])
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (orderHistory.length == 0) {
      getData()
    }
  }, [orderHistory, chainAddress])

  return (
    <>
      <div className="relative w-full h-64 overflow-x-auto vertical-thin">
        <table className="table w-full whitespace-nowrap text-left align-middle">
          <thead>
            <tr className="sticky top-0 bg-dark border-b border-gray-800">
              <th className="text-xs text-white font-light py-3 px-1">No</th>
              <th className="text-xs text-white font-light py-3 px-1">Market</th>
              <th className="text-xs text-white font-light py-3 px-1">Time</th>
              <th className="text-xs text-white font-light py-3 px-1">Type</th>
              <th className="text-xs text-white font-light py-3 px-1">Side</th>
              <th className="text-xs text-white font-light py-3 px-1">Amount</th>
              <th className="text-xs text-white font-light py-3 px-1">Price</th>
              <th className="text-xs text-white font-light py-3 px-1">Total</th>
              <th className="text-xs text-white font-light py-3 px-1">Fee</th>
              <th className="text-xs text-white font-light py-3 px-1">Liquidity</th>
            </tr>
          </thead>
          <tbody>
            {orderHistory.length > 0 ? (
              orderHistory.map((order, i) => {
                // const type = order.side == 'SELL' && 'MARKET'
                const total = parseFloat(order.size) * parseFloat(order.price)
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{order.ticker || order.market}</td>
                    <td>{formatTimeDifference(order.createdAt)}</td>
                    <td>{order.type}</td>
                    <td>{order.side}</td>
                    <td>{order.size}</td>
                    <td>${order.price}</td>
                    <td>${total.toFixed(3)}</td>
                    <td>${order.fee}</td>
                    <td>{order.liquidity}</td>
                  </tr>
                )
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
                    <p className="text-xs text-gray-400">You have no orders.</p>
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

export default OrderHistory
