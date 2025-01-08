import React, { forwardRef, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { formatPairName, showToast } from '../utils/helper'
import { useDispatch, useSelector } from 'react-redux'
import { selectData, setCopyBotLog } from '../redux-toolkit/dataSlice'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import { FaInfoCircle } from 'react-icons/fa'
import AboutCopyBotModal from './AboutCopyBotModal'

const CopyTradeBot = forwardRef(function CopyTradeBot(props, ref) {
  const { blockHeight, baseURL, server, enMemonic, freeCollateral, cryptoPair } = useSelector(selectData)
  const [userAddress, setUserAddress] = useState('')
  const [formData, setFormData] = useState({
    url: "", equityPercentage: ""
  })
  const [isDisabled, setIsDisabled] = useState(false)
  // const [close, setClose] = useState(false)
  // const [isWebScoketConnected, setIsWebScoketConnected] = useState(false)
  const userEquityRef = useRef(null)
  const blockHeightRef = useRef(blockHeight)
  const [filter, setFilter] = useState({ market: [], position: "both" });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null)
  const closeRef = useRef(false)
  const dispatch = useDispatch()
  const calculateTradeSize = (order) => {
    // leader equity
    const leaderEquity = Number(userEquityRef.current)
    // user to invest
    let followerEquity = Number(formData.equityPercentage)
    // total invested by leader
    const positionNotionalValue = Math.abs(Number(order.size)) * Number(order.price)
    // user total invest value

    // if (inputType == 'percentage') {
    const leaderNotionalValue = Math.abs(Number(order.size)) * Number(order.price)
    const followerNotionalValue = (Number(followerEquity) * leaderNotionalValue) / 100
    return followerNotionalValue / Number(order.price)
    // } else {
    //   const followerProportionalInvestment = (followerEquity * positionNotionalValue) / leaderEquity
    //   return followerProportionalInvestment / Number(order.price)
    // }
  }

  const handleFormData = (e) => {
    if (ref.current) {
      showToast("Colse Copy Bot To Change Value", 'error')
      return
    }
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCheckboxChange = (e) => {
    if (ref.current) {
      showToast("Close Copy Bot To Change Value", 'error');
      return;
    }

    const { value, checked } = e.target;

    // Check if the "Select All Markets" checkbox was clicked
    if (value === "select_all") {
      setFilter((prevFilter) => {
        const isAllSelected = prevFilter.market.length === cryptoPair.length;

        return {
          ...prevFilter,
          market: isAllSelected ? [] : cryptoPair.map((m) => m.ticker), // Select/Deselect all markets
        };
      });
      return;
    }

    // Individual market selection
    setFilter((prevFilter) => {
      const updatedMarket = checked
        ? [...prevFilter.market, value] // Add market
        : prevFilter.market.filter((item) => item !== value); // Remove market

      return { ...prevFilter, market: updatedMarket };
    });
  };

  const limitBuy = async (order, blockheightOfOrder) => {
    try {
      if (userEquityRef.current) {
        const followerTradeSize = calculateTradeSize(order)
        // console.log("In Limit Buy", { order, followerTradeSize })
        // return
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
          dispatch(setCopyBotLog({ actionType: "set", data: { ticker: order.ticker, status: "BuyOrderPlaced" } }))
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
        // console.log("In Limit Sell", { order, followerTradeSize })
        // return
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
          dispatch(setCopyBotLog({ actionType: "set", data: { ticker: order.ticker, status: "SellOrderPlaced" } }))
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

  const connectWebSocket = (userAddress) => {
    try {
      const ws = new WebSocket('wss://indexer.dydx.trade/v4/ws')
      ref.current = ws

      ws.onopen = () => {
        // setIsWebScoketConnected(true)
        const params = {
          type: 'subscribe',
          channel: 'v4_subaccounts',
          id: `${userAddress}/0`
        }
        ws.send(JSON.stringify(params))
      }

      ws.onmessage = async (event) => {
        const responseData = JSON.parse(event.data)
        if (responseData?.type === "error") {
          console.log("responseData.type === error so reconnecting to ws")
          if (ref.current) {
            ref.current.close()
          } else {
            console.log("responseData.type === error but ref not found")
          }
        }
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
            if (filter.market.length === 0 || filter.market.includes(order?.ticker)) {
              if (order.side == 'BUY') {
                console.log("fills", order)
                await limitBuy(order, blockheightOfOrder)
              } else if (order.side == 'SELL') {
                await limitSell(order, blockheightOfOrder)
              }
            } else {
              // console.log(`Not Buying Or Selling Order cause of not in selected market ${order?.ticker}`)
              if (order?.ticker === "BUY") {
                dispatch(setCopyBotLog({ actionType: "set", data: { ticker: order.ticker, status: "BuyOrderSkipped" } }))
              }
              if (order?.ticker === "SELL") {
                dispatch(setCopyBotLog({ actionType: "set", data: { ticker: order.ticker, status: "SellOrderSkipped" } }))
              }

            }
          }
        } else if (responseData.contents?.orders?.length > 0 && (responseData.contents?.orders[0]?.status != "CANCELED" || responseData.contents?.orders[0]?.status != "BEST_EFFORT_CANCELED")) {
          // TODO:
          dispatch(setCopyBotLog({ actionType: "set", data: { ticker: responseData.contents?.orders[0]?.ticker, status: "OrderSkipped" } }))
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket encountered an error:', event)
      }

      ws.onclose = (event) => {
        console.log("Ws Close Called", { closeRef: closeRef.current })
        if (!closeRef.current) {
          console.log("Ws Reconected", { closeRef: closeRef.current, ref: ref.current })
          if (ref.current) {
            ref.current.close()
          }
          connectWebSocket(userAddress)
          return
        }
        console.log("Ws Closed", { closeRef: closeRef.current })
        closeRef.current = false
        dispatch(setCopyBotLog({ actionType: "empty", data: [] }))
        console.log("After Ws Closed", { closeRef: closeRef.current })
        // setIsWebScoketConnected(false)
      }
    } catch (err) {
      console.error('copyBot WebSocket connection failed:', err)
    }
  }
  const decodeAddress = (encodedAddress) => {
    // console.log("Decoded Address", atob(encodedAddress))
    const decodedAddress = atob(encodedAddress)
    return decodedAddress;
  };

  const validateUrl = (url) => {
    const baseDomain = "https://dydxboard.com/";

    if (!url.startsWith(baseDomain)) {
      return false;
    }

    const encodedPart = url.slice(baseDomain.length);

    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Regex.test(encodedPart)) {
      return false;
    }

    try {
      atob(encodedPart); // This will throw an error if the string is not valid Base64
    } catch (e) {
      return false;
    }

    return true;
  };

  const validateAddress = (address) => {
    if (!address.startsWith("dydx")) {
      return false;
    }
    if (address.length !== 43) {
      return false;
    }
    const addressRegex = /^[a-zA-Z0-9]+$/;
    if (!addressRegex.test(address)) {
      return false;
    }

    return true;
  };

  const handleClick = () => {
    setIsDisabled(true)
    if (formData.url && formData.equityPercentage) {
      if (!validateUrl(formData.url)) {
        showToast('Please Insert Valid Url', 'error')
        return
      }
      const decodedAddress = decodeAddress(formData.url.split("/").pop())
      if (!validateAddress(decodedAddress)) {
        showToast('Please Insert Valid Url', 'error')
        return
      }
      if (Number(formData.equityPercentage) < 1) {
        showToast('Percentage To Invest Must Be Greater Than 1', 'error')
        return
      }
      setUserAddress(decodedAddress)
      // console.log({ filter, equityPercentage })
      connectWebSocket(decodedAddress)
      showToast('Copy bot started', 'success')
    } else {
      setIsDisabled(false)
      showToast('Please enter all details', 'error')
    }
  }

  const handleClose = () => {
    // setClose(!close)
    setIsDisabled(false)
    console.log("HandleClose Called", { closeRef: closeRef.current })
    closeRef.current = true
    console.log("CloseRefChanged TO True", { closeRef: closeRef.current })
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
        console.log("CloseRefChanged Occur so closing ws", { closeRef: closeRef.current })
        ref.current.close()
        ref.current = null
      }
    }
  }, [closeRef.current])

  return (
    <>
      <div className="relative grid grid-cols-12 gap-3 ">
        <div className="col-span-12 flex gap-1 items-center text-[#11e7b0] justify-end">
          <h5 className="text-xs cursor-pointer" onClick={() => document.getElementById('about_copybot').showModal()}>
            Instructions
          </h5>
          <button
            onClick={() => document.getElementById('about_copybot').showModal()}
            className="cursor-pointer"
          >
            <FaInfoCircle />
          </button>
        </div>
        <div className="relative flex justify-between col-span-12">
          <div className="text-xs text-gray-400">
            Avbl
            <span className="text-white mx-1">{freeCollateral.toFixed()} USDT</span>
          </div>
        </div>
        <div className="relative col-span-12">
          <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
            <span className="py-2 px-3 text-xs text-gray-400">DydxBoard URL</span>
            <input
              type="text"
              value={formData.url}
              placeholder="Enter DydxBoard URL e.g. https://dydxboard.com/"
              name="url"
              onChange={handleFormData}
              className="flex-1 w-full h-full p-2 text-xs border-0 outline-none bg-transparent text-end"
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
        <div className="relative col-span-12" ref={dropdownRef}>
          <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
            <span className="py-2 px-3 text-xs text-gray-400 whitespace-nowrap">Select Market(s) to Copy</span>
            <div className="relative w-full">
              <button
                type="button"
                className="w-full text-xs h-11 pl-2 text-white rounded-md bg-[#2A2D35] border-0 outline-none flex items-center justify-between"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {filter.market.length > 0
                  ? filter.market.slice(0, 1).join(', ') +
                  (filter.market.length > 1 ? `, +${filter.market.length - 1}` : '')
                  : 'Select Market'}
                <span className="material-icons">
                  {isDropdownOpen ? <MdExpandLess className='h-5 w-5' />
                    : <MdExpandMore className='h-5 w-5' />}
                </span>
              </button>
              {isDropdownOpen && (
                <div className="relative">
                  <div
                    className="vertical-thin absolute z-10 bg-[#2A2D35] border border-gray-600 rounded-md shadow-lg mt-2 p-2 w-full"
                    style={{
                      maxHeight: '20rem',
                      overflowY: 'auto',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search market..."
                      className="w-full px-2 py-1 mb-2 rounded-md bg-[#1F2228] text-white outline-none border border-gray-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {/* Select All Markets Option */}
                    <label className="flex items-center text-white px-2 py-1">
                      <input
                        type="checkbox"
                        value="select_all"
                        checked={filter.market.length === cryptoPair.length}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      Select All Markets
                    </label>

                    {cryptoPair &&
                      cryptoPair
                        .filter((market) =>
                          market?.ticker
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        )
                        .map((market, index) => (
                          <label
                            key={index}
                            className="flex items-center text-white px-2 py-1"
                          >
                            <input
                              type="checkbox"
                              value={market?.ticker}
                              checked={filter.market.includes(market?.ticker)}
                              onChange={handleCheckboxChange}
                              className="mr-2"
                            />
                            {formatPairName(market?.ticker)}
                          </label>
                        ))}

                    {/* No Results Found */}
                    {cryptoPair &&
                      cryptoPair.filter((market) =>
                        market?.ticker
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="text-center text-gray-400 py-2">
                          No results found
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>




        <div className="col-span-12">
          <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">

            {/* <select
              name="inputType"
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
              className="relative w-full h-11 text-white px-2 rounded-md bg-[#2A2D35] border-0 outline-none"
            >
              <option value="amount">Invest By Amount</option>
              <option value="percentage">Invest By Percentage</option>
            </select> */}

            <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
              <span className="py-2 px-3 text-gray-400 text-xs">Trade Percentage</span>
              <input
                type="number"
                value={formData.equityPercentage}
                placeholder="Trade Amount Percentage e.g. 1%"
                name="equityPercentage"
                onChange={handleFormData}
                className="flex-1 w-full h-full p-2 text-xs border-0 outline-none bg-transparent text-end"
              />
            </div>
          </div>
        </div>
        {/* <div className="col-span-6">
          <div className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center">
            <input
              type="number"
              value={equity}
              placeholder={`${inputType == 'amount' ? 'Enter Amount $' : 'Enter Percentage %'}`}
              onChange={(e) => setEquity(e.target.value)}
              className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
            />
          </div>
        </div> */}

        <div className="col-span-12">
          <button
            type="button"
            className={`${isDisabled ? 'cursor-not-allowed' : ''} relative inline-block w-full h-full min-h-11 bg-[#11e7b0] hover:bg-[#14b38a]  text-white rounded-md`}
            onClick={handleClick}
            disabled={isDisabled}
          >
            Start Copy Trade Bot
          </button>
        </div>
        <div className="col-span-12">
          <button
            type="button"
            className={`${isDisabled ? 'cursor-pointer' : 'cursor-not-allowed'} relative inline-block w-full h-full min-h-11 bg-[#eb4034] hover:bg-[#b52f26]  text-white rounded-md`}
            onClick={handleClose}
            disabled={!isDisabled}
          >
            Stop Copy Trade Bot
          </button>
        </div>
      </div>
      <AboutCopyBotModal />
    </>
  )
})

export default CopyTradeBot
