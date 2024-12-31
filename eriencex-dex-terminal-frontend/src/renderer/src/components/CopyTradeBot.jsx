import React, { forwardRef, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { showToast } from '../utils/helper'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'

const CopyTradeBot = forwardRef(function CopyTradeBot(props, ref) {
  const { blockHeight, baseURL, server, enMemonic, freeCollateral } = useSelector(selectData)
  const [userAddress, setUserAddress] = useState('')
  const [equity, setEquity] = useState('')
  // const [subAccNumber, setSubAccNumber] = useState('')
  const [close, setClose] = useState(false)
  const [isWebScoketConnected, setIsWebScoketConnected] = useState(false)
  const [inputType, setInputType] = useState('amount')
  const userEquityRef = useRef(null)
  const blockHeightRef = useRef(blockHeight)

  const calculateTradeSize = (order) => {
    // leader equity
    const leaderEquity = Number(userEquityRef.current)
    // user to invest
    let followerEquity = Number(equity)
    // total invested by leader
    const positionNotionalValue = Math.abs(Number(order.size)) * Number(order.price)
    // user total invest value

    if (inputType == 'percentage') {
      const leaderNotionalValue = Math.abs(Number(order.size)) * Number(order.price)
      const followerNotionalValue = (Number(followerEquity) * leaderNotionalValue) / 100
      return followerNotionalValue / Number(order.price)
    } else {
      const followerProportionalInvestment = (followerEquity * positionNotionalValue) / leaderEquity
      return followerProportionalInvestment / Number(order.price)
    }
  }

  const limitBuy = async (order, blockheightOfOrder) => {
    try {
      if (userEquityRef.current) {
        const followerTradeSize = calculateTradeSize(order)

        const res = await axios.post(`${baseURL}api/v1/executeCopyLimitorder`, {
          pair: order.ticker,
          size: followerTradeSize,
          side: 'buy',
          triggerPrice: Number(order.price),
          oType: 'LIMIT',
          price: Number(order.price),
          memonic: enMemonic,
          ordertype: order.timeInForce,
          time: 0,
          timeFrame: 'minute',
          reduceOnly: order.reduceOnly,
          postOnly: order.postOnly,
          currentHeight: Number(blockHeightRef.current) + 10,
          goodTilBlock: Number(order.goodTilBlock),
          blockHeight: blockheightOfOrder,
          network: server
        })
        const data = res.data
        if (
          !data.message.startsWith('Broadcasting transaction failed') &&
          !data.message.startsWith('Bad status on response')
        ) {
          showToast(data.message, 'success')
        }
        return data
      }
    } catch (err) {
      if (err == "Error: Error invoking remote method 'copy-limit-order': reply was never sent") {
        return limitBuy(order, blockheightOfOrder)
      }
      console.log(err)
    }
  }

  const limitSell = async (order, blockheightOfOrder) => {
    try {
      if (userEquityRef.current) {
        const followerTradeSize = calculateTradeSize(order)

        const res = await axios.post(`${baseURL}api/v1/executeCopyLimitorder`, {
          pair: order.ticker,
          size: followerTradeSize,
          side: 'sell',
          triggerPrice: Number(order.price),
          oType: 'LIMIT',
          price: Number(order.price),
          memonic: enMemonic,
          ordertype: order.timeInForce,
          time: 0,
          timeFrame: 'minute',
          reduceOnly: order.reduceOnly,
          postOnly: order.postOnly,
          currentHeight: Number(blockHeightRef.current) + 10,
          goodTilBlock: Number(order.goodTilBlock),
          blockHeight: blockheightOfOrder,
          network: server
        })
        const data = res.data
        if (
          !data.message.startsWith('Broadcasting transaction failed') &&
          !data.message.startsWith('Bad status on response')
        ) {
          showToast(data.message, 'success')
        }
        return data
      }
    } catch (err) {
      if (err == "Error: Error invoking remote method 'copy-limit-order': reply was never sent") {
        return limitSell(order, blockheightOfOrder)
      }
      console.log(err)
    }
  }

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('wss://indexer.dydx.trade/v4/ws')
      ref.current = ws

      ws.onopen = () => {
        setIsWebScoketConnected(true)
        const params = {
          type: 'subscribe',
          channel: 'v4_subaccounts',
          id: `${userAddress}/0`
        }
        ws.send(JSON.stringify(params))
      }

      ws.onmessage = async (event) => {
        const responseData = JSON.parse(event.data)

        if (responseData.contents?.subaccount) {
          const newEquity = Number(responseData.contents?.subaccount.equity)
          userEquityRef.current = newEquity
        }

        if (responseData.contents?.fills) {
          const contents = responseData.contents
          const blockheightOfOrder = Number(contents.blockHeight)

          const orders = contents.orders
          for (let index = 0; index < orders.length; index++) {
            const order = orders[index]
            if (order.side == 'BUY') {
              await limitBuy(order, blockheightOfOrder)
            } else if (order.side == 'SELL') {
              await limitSell(order, blockheightOfOrder)
            }
          }
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket encountered an error:', event)
      }

      ws.onclose = (event) => {
        setIsWebScoketConnected(false)
      }
    } catch (err) {
      console.error('copyBot WebSocket connection failed:', err)
    }
  }

  const handleClick = () => {
    if (userAddress && equity) {
      connectWebSocket()
      showToast('Copy bot started', 'success')
    } else {
      showToast('Please enter all details', 'error')
    }
  }

  const handleClose = () => {
    setClose(!close)
    if (ref.current) {
      showToast('Copy bot closed', 'info')
    }
  }

  useEffect(() => {
    blockHeightRef.current = blockHeight
  }, [blockHeight])

  useEffect(() => {
    return () => {
      if (ref.current) {
        ref.current.close()
        ref.current = null
      }
    }
  }, [close])

  return (
    <>
      <div className="relative grid grid-cols-12 gap-3">
        <div className="relative flex justify-between col-span-12">
          <div className="text-xs text-gray-400">
            Avbl
            <span className="text-white mx-1">{freeCollateral.toFixed()} USDT</span>
          </div>
        </div>
        <div className="relative col-span-12">
          <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
            <span className="py-2 px-3">User Address</span>
            <input
              type="text"
              value={userAddress}
              placeholder="Enter user address"
              name="from"
              onChange={(e) => setUserAddress(e.target.value)}
              className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
            />
          </div>
        </div>
        {/* <div className="col-span-12">
          <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
            <span className="py-2 px-3">Sub Account Number</span>
            <input
              type="number"
              value={subAccNumber}
              placeholder="Enter Sub Account Number"
              onChange={(e) => setSubAccNumber(e.target.value)}
              className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
            />
          </div>
        </div> */}

        <div className="col-span-6">
          <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
            <select
              name="inputType"
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
              className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
            >
              <option value="amount">Invest By Amount</option>
              <option value="percentage">Invest By Percentage</option>
            </select>
          </div>
        </div>
        <div className="col-span-6">
          <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
            <input
              type="number"
              value={equity}
              placeholder={`${inputType == 'amount' ? 'Enter Amount $' : 'Enter Percentage %'}`}
              onChange={(e) => setEquity(e.target.value)}
              className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
            />
          </div>
        </div>

        <div className="col-span-12">
          <button
            type="button"
            className={`${isWebScoketConnected ? 'cursor-not-allowed' : ''} relative inline-block w-full h-full min-h-11 bg-[#11e7b0] hover:bg-[#14b38a]  text-white rounded-md`}
            onClick={handleClick}
            disabled={isWebScoketConnected}
          >
            Copy Bot
          </button>
        </div>
        <div className="col-span-12">
          <button
            type="button"
            className={`${isWebScoketConnected ? 'cursor-pointer' : 'cursor-not-allowed'} relative inline-block w-full h-full min-h-11 bg-[#eb4034] hover:bg-[#b52f26]  text-white rounded-md`}
            onClick={handleClose}
            disabled={!isWebScoketConnected}
          >
            Close Bot
          </button>
        </div>
      </div>
    </>
  )
})

export default CopyTradeBot
