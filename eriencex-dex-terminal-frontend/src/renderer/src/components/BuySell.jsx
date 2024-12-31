import React, { useEffect, useRef, useState } from 'react'
import Limit from './Limit'
import Market from './Market'
import StopLimit from './StopLimit'
import StopMarket from './StopMarket'
import TakeProfitLimit from './TakeProfitLimit'
import TakeProfitMarket from './TakeProfitMarket'
import GridBotForm from './GridBotForm'
import CopyTradeBot from './CopyTradeBot'
import axios from 'axios'
import { calculateBuyingPower, formatPairName, showToast } from '../utils/helper'
import usePreventNumberInputScroll from '../utils/usePreventNumberScroll'
import { useDispatch, useSelector } from 'react-redux'
import { selectData, setGridSettings, setJsonData } from '../redux-toolkit/dataSlice'

const BuySell = () => {
  const tabRefs = useRef([])
  const tabs = [
    'Limit',
    'Market',
    'Grid Bot',
    // 'Stop Limit',
    // 'Stop Market',
    // 'Take Profit Limit',
    // 'Take Profit Market',
    'Copy Bot'
  ]

  const {
    pair,
    freeCollateral,
    memonic,
    cryptoPair,
    chainAddress,
    gridSettings,
    blockHeight,
    jsonData,
    baseURL,
    server,
    enMemonic,
    tickerDecimals,
    userEquity
  } = useSelector(selectData)

  usePreventNumberInputScroll()

  const [tabIndex, setTabIndex] = useState(0)
  const name = pair && formatPairName(pair)?.split('-')
  const [buyLoading, setBuyLoading] = useState(false)
  const [sellLoading, setSellLoading] = useState(false)
  const [marginFraction, setMarginFraction] = useState([])
  const [price, setPrice] = useState(0)
  const websocketRef = useRef(null)
  const blockHeightRef = useRef(null)
  const dispatch = useDispatch()
  const [intialLoad, setIntialLoad] = useState(false)
  let initialstate = {
    from: '',
    to: '',
    dollars: '',
    totalGrid: '',
    slippage: '',
    profitPercentage: '',
    isGridActive: true
  }
  const [gridBot, setGridBot] = useState(initialstate)

  const generateOrderid = (length, message) => {
    const charset = '0123456789'
    let randomNumberString = ''
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      randomNumberString += charset[randomIndex]
    }
    const str = `4552${randomNumberString}`
    return String(str)
  }

  useEffect(() => {
    blockHeightRef.current = blockHeight
  }, [blockHeight])

  const getJsonData = async () => {
    const res = await window.electron.getDBData()
    dispatch(setJsonData(res))
  }

  // step size according to the current pair
  const getStepSize = () => {
    if (cryptoPair) {
      const tickerInfo = cryptoPair.filter((pairData) => pairData.ticker == pair)
      return parseFloat(tickerInfo[0].stepSize)
    }
  }

  const validateGridData = () => {
    if (cryptoPair.length > 0) {
      const currentPairData = cryptoPair.find((data) => data.ticker == pair)
      const requiredAmount =
        parseFloat(currentPairData.oraclePrice) * parseFloat(currentPairData.stepSize)
      const usersAmount = parseFloat(gridBot.dollars) / parseFloat(gridBot.totalGrid)
      const requireInvestAmount = requiredAmount * parseFloat(gridBot.totalGrid)
      if (usersAmount <= requiredAmount) {
        showToast(
          `Insufficient funds to start the grid for "${pair}".\n` +
            `Required invest Amount: $${requireInvestAmount.toFixed()}\n` +
            `Your Amount: $${gridBot.dollars}\n\n` +
            `Please increase your investment or adjust the grid settings.`,
          'error'
        )
        return false
      }
      return true
    }
  }

  useEffect(() => {
    getJsonData()
  }, [])

  useEffect(() => {
    if (cryptoPair.length > 0) {
      // setIntialLoad(true)
      const tickerInfo = cryptoPair.find((p) => p.ticker == pair)
      setPrice(parseFloat(tickerInfo?.oraclePrice))
      setMarginFraction(tickerInfo)
    }
  }, [cryptoPair])

  useEffect(() => {
    if (jsonData) {
      dispatch(setGridSettings(jsonData?.allGridSettings))
    }
  }, [jsonData])

  // useEffect(() => {
  // if (jsonData && intialLoad) {
  //     const activeGridData = jsonData.allGridSettings.find((item) => item.isGridActive)
  // if (activeGridData) {
  //   const finalSize = calculateFinalSize(activeGridData)
  //   window.electron.startWebSocket(activeGridData.pair, finalSize, baseURL)
  //   if (chainAddress) {
  //     window.electron.startSubAccWebSocket(chainAddress, finalSize, baseURL)
  //   }
  // }
  //   }
  // }, [intialLoad])

  const handleGridChange = (e) => {
    const { name, value } = e.target
    setGridBot({ ...gridBot, [name]: value })
  }

  const calculateFinalSize = (gridData) => {
    if (gridData) {
      const tradePrice = Number(gridData.dollars) / Number(gridData.totalGrid)
      const finalSize = tradePrice / Number(price)
      return finalSize
    }
  }

  const startGrid = async (gridData) => {
    if (!gridData) {
      showToast('No grid data provided', 'error')
      return
    }
    const isValidate = validateGridData()
    if (!isValidate) {
      console.log('Grid data is not valid')
      return
    }
    const finalSize = calculateFinalSize(gridData)
    const gridId = Math.floor(100000 + Math.random() * 900000).toString()
    const updatedGridBot = {
      ...gridBot,
      gridId,
      from: Number(gridBot.from),
      to: Number(gridBot.to),
      dollars: Number(gridBot.dollars),
      totalGrid: Number(gridBot.totalGrid),
      slippage: Number(gridBot.slippage),
      profitPercentage: Number(gridBot.profitPercentage)
    }

    if (!memonic) {
      showToast('Mnemonic is required', 'error')
      return
    }

    try {
      if (chainAddress && finalSize) {
        await window.electron.fetchGridData(pair, updatedGridBot)
        const res = await window.electron.getDBData()
        dispatch(setJsonData(res))
        await window.electron.startSubAccWebSocket(chainAddress, finalSize, baseURL, updatedGridBot)
        setTimeout(async () => {
          await window.electron.startWebSocket(pair, finalSize, baseURL)
        }, 3000)
        showToast('Grid bot started successfully', 'success')
        setGridBot(initialstate)
      }
    } catch (error) {
      console.error('Error starting grid:', error)
      showToast('Error starting grid', 'error')
    }
  }

  // start grid bot function for gridBot form
  const handleClick = (e) => {
    e.preventDefault()
    if (chainAddress) {
      const isEmpty = Object.values(gridBot).some((value) => value === '')

      if (isEmpty) {
        showToast('Please fill out all fields before starting the grid bot', 'error')
        return
      }
      if (gridSettings) {
        const activeGrid = gridSettings.some((item) => item.pair === pair && item.isGridActive)
        if (activeGrid) {
          showToast('Cannot add new grid, please close existing grid', 'error')
          return
        }
        if (jsonData.profileSettings[0]?.memonic != '') {
          startGrid(gridBot)
        } else {
          // console.log('json data is empty')
        }
      } else {
        showToast('Please provide memonic first', 'error')
      }
    } else {
      showToast('Please connect to your account', 'error')
    }
  }

  const initialMarginFraction = marginFraction && marginFraction?.initialMarginFraction
  let buyingRange = calculateBuyingPower(freeCollateral, initialMarginFraction)

  // -------------------------------- function to stop input (type number) value change --------------------------------
  useEffect(() => {
    function preventScrollChange(event) {
      if (document.activeElement === event.target) {
        event.preventDefault()
      }
    }

    document.querySelectorAll('input[type="number"]').forEach((input) => {
      input.addEventListener('wheel', preventScrollChange, { passive: true })
    })
    return () => {
      document.removeEventListener('wheel', preventScrollChange)
    }
  }, [])

  //  LIMIT --------------------------------------------------------------------------------------------------------------
  const [limit, setLimit] = useState({
    buyLimitPrice: '',
    buyPrice: '',
    buyTimeInForce: 'GTT',
    buyTime: '28',
    buyTimeFrame: 'day',
    buyReduceOnly: false,
    buyPostOnly: false,
    buySize: '',
    buyTotal: '',
    sellTimeInForce: 'GTT',
    sellTime: '28',
    sellTimeFrame: 'day',
    sellReduceOnly: false,
    sellPostOnly: false,
    sellLimitPrice: '',
    sellPrice: '',
    sellSize: '',
    sellTotal: ''
  })

  const handleLimitChange = (e) => {
    const { name, value } = e.target
    const nValue = parseFloat(value)

    if (name === 'buySize' && !isNaN(nValue) && limit.buyLimitPrice !== '') {
      const buyPrice = parseFloat(limit.buyLimitPrice) * nValue
      const stepSize = getStepSize()
      const stepDecimals = stepSize.toString().split('.')[1]?.length || 0
      const roundedValue = parseFloat(parseFloat(nValue).toFixed(stepDecimals))

      if (buyPrice > buyingRange) {
        setLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice: buyingRange,
          [name]: roundedValue,
          buyTotal: buyingRange.toFixed(stepDecimals)
        }))
      } else {
        setLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice,
          [name]: roundedValue,
          buyTotal: buyPrice.toFixed(3)
        }))
      }
    } else if (name === 'sellSize' && !isNaN(nValue) && limit.sellLimitPrice !== '') {
      const sellPrice = parseFloat(limit.sellLimitPrice) * nValue
      if (sellPrice > buyingRange) {
        setLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice: buyingRange,
          [name]: nValue,
          sellTotal: buyingRange.toFixed(3)
        }))
      } else {
        setLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice,
          [name]: nValue,
          sellTotal: sellPrice.toFixed(3)
        }))
      }
    } else if (name === 'sellPrice' && !isNaN(nValue) && limit.sellLimitPrice !== '') {
      let sellSize = nValue / parseFloat(limit.sellLimitPrice)
      sellSize = sellSize.toFixed(2)
      setLimit((prevLimit) => ({
        ...prevLimit,
        sellPrice: nValue,
        sellSize: parseFloat(sellSize),
        sellTotal: nValue.toFixed(2)
      }))
    } else if (name === 'buyLimitPrice' && !isNaN(nValue) && limit.buySize !== '') {
      const buyPrice = parseFloat(limit.buySize) * nValue
      if (buyPrice > buyingRange) {
        setLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice: buyingRange,
          [name]: nValue,
          buyTotal: buyingRange
        }))
      } else {
        setLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice: buyPrice.toFixed(1),
          [name]: nValue,
          buyTotal: buyPrice.toFixed(1)
        }))
      }
    } else if (name === 'sellLimitPrice' && !isNaN(nValue) && limit.sellSize !== '') {
      const sellPrice = parseFloat(limit.sellSize) * nValue
      if (sellPrice > buyingRange) {
        setLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice: buyingRange,
          [name]: nValue,
          sellTotal: buyingRange
        }))
      } else {
        setLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice: sellPrice.toFixed(1),
          [name]: nValue,
          sellTotal: sellPrice.toFixed(1)
        }))
      }
    } else {
      setLimit((prevLimit) => ({
        ...prevLimit,
        [name]: nValue
      }))
    }
  }

  const handleBuyRangeLimit = (e) => {
    const newBuyLimitPrice = parseFloat(e.target.value)
    let buySize = limit.buySize
    // buySize = buySize.toFixed(4);
    setLimit((prevLimit) => ({
      ...prevLimit,
      buyLimitPrice: newBuyLimitPrice,
      buySize: buySize,
      buyTotal: (buySize * newBuyLimitPrice).toFixed(1)
    }))
  }

  const handleSellRangeLimit = (e) => {
    const newSellLimitPrice = parseFloat(e.target.value)
    let sellSize = limit.sellSize
    setLimit((prevLimit) => ({
      ...prevLimit,
      sellLimitPrice: newSellLimitPrice,
      sellSize: sellSize,
      sellTotal: (sellSize * newSellLimitPrice).toFixed(1)
    }))
  }

  const limitBuy = async () => {
    try {
      if (memonic != '') {
        setBuyLoading(true)
        const timeValue = limit.buyTimeInForce === 'IOC' ? 0 : parseFloat(limit.buyTime)
        const res = await axios.post(`${baseURL}api/v1/limitorder`, {
          pair: pair,
          size: parseFloat(limit.buySize),
          side: 'buy',
          triggerPrice: parseFloat(limit.buyLimitPrice),
          oType: 'LIMIT',
          price: parseFloat(limit.buyLimitPrice),
          memonic: enMemonic,
          ordertype: limit.buyTimeInForce,
          orderid: generateOrderid(6, 'LimitBuy'),
          time: timeValue,
          timeFrame: limit.buyTimeFrame,
          reduceOnly: limit.buyReduceOnly,
          postOnly: limit.buyPostOnly,
          network: server
        })
        const data = res.data
        showToast(data.message, 'success')
        setLimit({ ...limit, buyLimitPrice: '', buySize: '', buyTotal: '', buyTime: '' })
        setBuyLoading(false)
      } else {
        showToast('Please provide memonic first', 'warning')
        setBuyLoading(false)
      }
    } catch (error) {
      setBuyLoading(false)
      console.log('error', error)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
    }
  }

  const limitSell = async () => {
    try {
      setSellLoading(true)
      const timeValue = limit.sellTimeInForce === 'IOC' ? 0 : parseFloat(limit.sellTime)
      const res = await axios.post(`${baseURL}api/v1/limitorder`, {
        pair: pair,
        size: parseFloat(limit.sellSize),
        side: 'sell',
        triggerPrice: parseFloat(limit.sellLimitPrice),
        oType: 'LIMIT',
        price: parseFloat(limit.sellLimitPrice),
        memonic: enMemonic,
        ordertype: limit.sellTimeInForce,
        orderid: generateOrderid(6, 'LimitSell'),
        time: timeValue,
        timeFrame: limit.sellTimeFrame,
        reduceOnly: limit.sellReduceOnly,
        postOnly: limit.sellPostOnly,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')
      setLimit({ ...limit, sellLimitPrice: '', sellSize: '', sellTotal: '', sellTime: '' })

      setSellLoading(false)
    } catch (error) {
      setSellLoading(false)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
    }
  }

  //  MARKET --------------------------------------------------------------------------------------
  const [market, setMarket] = useState({
    buyPrice: '',
    buySize: '',
    buyTotal: '',
    sellPrice: '',
    sellSize: '',
    sellTotal: '',
    buyReduceOnly: false,
    sellReduceOnly: false
  })

  const handleMarket = (e) => {
    const { name, value } = e.target
    let nValue = parseFloat(value)

    const stepSize = getStepSize()
    const stepDecimals = stepSize.toString().split('.')[1]?.length || 0
    let buyPrice = market.buyPrice
    let buySize = market.buySize
    let sellPrice = market.sellPrice
    let sellSize = market.sellSize
    let buyTotal = market.buyTotal
    let sellTotal = market.sellTotal

    if (name === 'buySize') {
      nValue = Number(Number(nValue).toFixed(stepDecimals))
      buyPrice = nValue * price
      if (buyPrice > buyingRange) {
        buyPrice = buyingRange
        buyTotal = buyingRange
        buySize = (buyPrice / price).toFixed(stepDecimals)
      } else {
        buyPrice = Number(buyPrice).toFixed(tickerDecimals[pair])
        buyTotal = Number(buyPrice).toFixed(tickerDecimals[pair])
        buySize = nValue
      }
    } else if (name === 'buyPrice') {
      buyPrice = nValue
      if (buyPrice > buyingRange) {
        buyPrice = buyingRange
        buySize = (buyPrice / price).toFixed(stepDecimals)
        buyTotal = buyingRange
      } else {
        buyPrice = nValue
        buySize = (nValue / price).toFixed(stepDecimals)
        buyTotal = nValue
      }
    } else if (name === 'sellPrice') {
      nValue = Number(Number(nValue).toFixed(stepDecimals))
      sellSize = (nValue / price).toFixed(stepDecimals)
      sellPrice = nValue
      sellTotal = nValue
    } else if (name === 'sellSize') {
      nValue = Number(Number(nValue).toFixed(stepDecimals))
      sellPrice = nValue * price

      if (sellPrice > buyingRange) {
        sellPrice = buyingRange
        sellTotal = buyingRange
        sellSize = (sellPrice / price).toFixed(stepDecimals)
      } else {
        sellPrice = Number(sellPrice).toFixed(tickerDecimals[pair])
        sellTotal = Number(nValue * price).toFixed(tickerDecimals[pair])
        sellSize = nValue
      }
    }

    setMarket({
      ...market,
      buyPrice,
      buySize,
      sellPrice,
      sellSize,
      buyTotal,
      sellTotal
    })
  }

  const handleBuyRangeMarket = (e) => {
    const buyPrice = parseFloat(e.target.value)
    const stepSize = getStepSize()
    const stepDecimals = stepSize.toString().split('.')[1]?.length || 0
    setMarket((prev) => ({
      ...prev,
      buyPrice: buyPrice,
      buyTotal: buyPrice,
      buySize: (buyPrice / price).toFixed(stepDecimals)
    }))
  }

  const handleSellRangeMarket = (e) => {
    const sellPrice = parseFloat(e.target.value)
    const stepSize = getStepSize()
    const stepDecimals = stepSize.toString().split('.')[1]?.length || 0
    setMarket((prev) => ({
      ...prev,
      sellPrice: sellPrice,
      sellTotal: sellPrice,
      sellSize: (sellPrice / price).toFixed(stepDecimals)
    }))
  }

  useEffect(() => {
    if (market.buySize != '') {
      setMarket({
        ...market,
        buyPrice: (market.buySize * price).toFixed(),
        buyTotal: (market.buySize * price).toFixed()
      })
    }
    if (market.sellSize != '') {
      setMarket({
        ...market,
        sellPrice: (market.sellSize * price).toFixed(),
        sellTotal: (market.sellSize * price).toFixed()
      })
    }
    if (stopMarket.buySize != '') {
      setStopMarket({
        ...stopMarket,
        buyPrice: (stopMarket.buySize * price).toFixed()
      })
    }
    if (stopMarket.sellSize != '') {
      setStopMarket({
        ...stopMarket,
        sellPrice: (stopMarket.sellSize * price).toFixed()
      })
    }
    if (stopLimit.buySize != '') {
      setStopLimit({
        ...stopLimit,
        buyPrice: (stopLimit.buySize * price).toFixed(),
        buyTotal: (stopLimit.buySize * price).toFixed()
      })
    }
    if (stopLimit.sellSize != '') {
      setStopLimit({
        ...stopLimit,
        sellPrice: (stopLimit.sellSize * price).toFixed(),
        sellTotal: (stopLimit.sellSize * price).toFixed()
      })
    }
  }, [price])

  const marketBuy = async () => {
    try {
      setBuyLoading(true)
      const res = await axios.post(`${baseURL}api/v1/order`, {
        pair: pair,
        size: parseFloat(market.buySize),
        side: 'buy',
        memonic: enMemonic,
        reduceOnly: false,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')

      setBuyLoading(false)
      setMarket({ ...market, buyPrice: '', buySize: '', buyTotal: '', buyReduceOnly: false })
    } catch (error) {
      showToast(`Error placing order ${error.response.data.message}`, 'error')
      setBuyLoading(false)
    }
  }

  const marketSell = async () => {
    try {
      setSellLoading(true)
      const res = await axios.post(`${baseURL}api/v1/order`, {
        pair: pair,
        size: parseFloat(market.sellSize),
        side: 'sell',
        memonic: enMemonic,
        reduceOnly: false,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')

      setSellLoading(false)
      setMarket({ ...market, sellPrice: '', sellSize: '', sellTotal: '', sellReduceOnly: false })
    } catch (error) {
      setSellLoading(false)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
      console.error(error)
    }
  }

  //  ---------------------------------------------------- STOPLIMIT ----------------------------------------------------
  const [stopLimit, setStopLimit] = useState({
    buyTriggerPrice: '',
    buyLimitPrice: '',
    buyPrice: '',
    buySize: '',
    buyTotal: '',
    buyTimeInForce: 'GTT',
    buyTime: '',
    buyTimeFrame: 'minute',
    buyReduceOnly: false,
    sellTriggerPrice: '',
    sellLimitPrice: '',
    sellPrice: '',
    sellSize: '',
    sellTotal: '',
    sellTimeInForce: 'GTT',
    sellTime: '',
    sellTimeFrame: '',
    sellReduceOnly: false
  })

  const handleStopLimitChange = (e) => {
    const { name, value } = e.target
    const nValue = parseFloat(value)

    if (name === 'buySize' && !isNaN(nValue) && stopLimit.buyLimitPrice !== '') {
      const buyPrice = parseFloat(stopLimit.buyLimitPrice) * nValue
      if (buyPrice > buyingRange) {
        setStopLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice: buyingRange,
          [name]: nValue,
          buyTotal: buyingRange
        }))
      } else {
        setStopLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice,
          [name]: nValue,
          buyTotal: buyPrice
        }))
      }
    } else if (name === 'buyPrice' && !isNaN(nValue) && stopLimit.buyLimitPrice !== '') {
      let buySize = nValue / parseFloat(stopLimit.buyLimitPrice)
      buySize = buySize.toFixed(4)
      setStopLimit((prevLimit) => ({
        ...prevLimit,
        buyPrice: nValue,
        buySize: parseFloat(buySize),
        buyTotal: nValue
      }))
    } else if (name === 'sellSize' && !isNaN(nValue) && stopLimit.sellLimitPrice !== '') {
      const sellPrice = parseFloat(stopLimit.sellLimitPrice) * nValue
      if (sellPrice > buyingRange) {
        setStopLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice: buyingRange,
          [name]: nValue,
          sellTotal: buyingRange
        }))
      } else {
        setStopLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice,
          [name]: nValue,
          sellTotal: sellPrice
        }))
      }
    } else if (name === 'sellPrice' && !isNaN(nValue) && limit.sellLimitPrice !== '') {
      let sellSize = nValue / parseFloat(stopLimit.sellLimitPrice)
      sellSize = sellSize.toFixed(4)
      setStopLimit((prevLimit) => ({
        ...prevLimit,
        sellPrice: nValue,
        sellSize: parseFloat(sellSize),
        sellTotal: nValue
      }))
    } else if (name === 'buyLimitPrice' && !isNaN(nValue) && stopLimit.buySize !== '') {
      const buyPrice = parseFloat(stopLimit.buySize) * nValue
      if (buyPrice > buyingRange) {
        setStopLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice: buyingRange,
          [name]: nValue,
          buyTotal: buyingRange
        }))
      } else {
        setStopLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice,
          [name]: nValue,
          buyTotal: buyPrice
        }))
      }
    } else if (name === 'sellLimitPrice' && !isNaN(nValue) && stopLimit.sellSize !== '') {
      const sellPrice = parseFloat(stopLimit.sellSize) * nValue
      if (sellPrice > buyingRange) {
        setStopLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice: buyingRange,
          [name]: nValue,
          sellTotal: buyingRange
        }))
      } else {
        setStopLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice,
          [name]: nValue,
          sellTotal: sellPrice
        }))
      }
    } else {
      setStopLimit((prevLimit) => ({
        ...prevLimit,
        [name]: nValue
      }))
    }
  }

  const handleBuyRangeStopLimit = (e) => {
    const buyPrice = parseFloat(e.target.value)
    const buyLimitPrice = stopLimit.buyLimitPrice
    const buySize = (buyPrice / price).toFixed(4)
    setStopLimit((prev) => ({
      ...prev,
      buyPrice: buyPrice,
      buySize: buySize,
      buyTotal: (buySize * buyLimitPrice).toFixed(1)
    }))
  }

  const handleSellRangeStopLimit = (e) => {
    const sellPrice = parseFloat(e.target.value)
    const sellLimitPrice = stopLimit.sellLimitPrice
    const sellSize = (sellPrice / price).toFixed(4)
    setStopLimit((prev) => ({
      ...prev,
      sellPrice: sellPrice,
      sellSize: sellSize,
      sellTotal: (sellSize * sellLimitPrice).toFixed(1)
    }))
  }

  const stopLimitBuy = async () => {
    try {
      setBuyLoading(true)
      const res = await axios.post(`${baseURL}api/v1/limitorder`, {
        pair: pair,
        size: parseFloat(stopLimit.buySize),
        side: 'buy',
        triggerPrice: parseFloat(stopLimit.buyTriggerPrice),
        oType: 'STOP_LIMIT',
        price: parseFloat(stopLimit.buyTriggerPrice),
        memonic: enMemonic,
        ordertype: stopLimit.buyTimeInForce,
        orderid: generateOrderid(6, 'StopLimitBuy'),
        time: parseFloat(stopLimit.buyTime),
        timeFrame: stopLimit.buyTimeFrame,
        reduceOnly: stopLimit.buyReduceOnly,
        postOnly: false,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')

      setStopLimit({
        ...stopLimit,
        buyTriggerPrice: '',
        buyLimitPrice: '',
        buySize: '',
        buyTime: ''
      })
      setBuyLoading(false)
    } catch (error) {
      setBuyLoading(false)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
    }
  }

  const stopLimitSell = async () => {
    try {
      setSellLoading(true)
      const res = await axios.post(`${baseURL}api/v1/limitorder`, {
        pair: pair,
        size: parseFloat(stopLimit.sellSize),
        side: 'sell',
        triggerPrice: parseFloat(stopLimit.sellTriggerPrice),
        oType: 'STOP_LIMIT',
        price: parseFloat(stopLimit.sellTriggerPrice),
        memonic: enMemonic,
        ordertype: stopLimit.sellTimeInForce,
        orderid: generateOrderid(6, 'StopLimitSell'),
        time: parseFloat(stopLimit.sellTime),
        timeFrame: stopLimit.sellTimeFrame,
        reduceOnly: stopLimit.sellReduceOnly,
        postOnly: false,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')

      setStopLimit({
        ...stopLimit,
        sellTriggerPrice: '',
        sellLimitPrice: '',
        sellSize: '',
        sellTime: ''
      })
      setSellLoading(false)
    } catch (error) {
      setSellLoading(false)
      console.error(error)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
    }
  }

  //  STOPMARKET ------------------------------------------------------------------------
  const [stopMarket, setStopMarket] = useState({
    buyTriggerPrice: '',
    buyPrice: '',
    buySize: '',
    buyTotal: '',
    buyTimeInForce: 'IOC',
    buyTime: '',
    buyTimeFrame: 'minute',
    buyReduceOnly: false,
    sellTriggerPrice: '',
    sellPrice: '',
    sellSize: '',
    sellTotal: '',
    sellTimeInForce: 'IOC',
    sellTime: '',
    sellTimeFrame: '',
    sellReduceOnly: false
  })

  const handleStopMarketChange = (e) => {
    const { name, value } = e.target
    const nValue = parseFloat(value)

    let buyPrice = stopMarket.buyPrice
    let buySize = stopMarket.buySize
    let sellPrice = stopMarket.sellPrice
    let sellSize = stopMarket.sellSize
    let buyTotal = stopMarket.buyTotal
    let sellTotal = stopMarket.sellTotal
    let buyTriggerPrice = stopMarket.buyTriggerPrice
    let sellTriggerPrice = stopMarket.sellTriggerPrice

    if (name === 'buySize') {
      buyPrice = (nValue * price).toFixed(1)
      if (buyPrice > buyingRange) {
        buyPrice = buyingRange
        buyTotal = buyingRange
        buySize = nValue
      } else {
        buyPrice = buyPrice
        buySize = nValue
        buyTotal = buyTriggerPrice * nValue
      }
    } else if (name === 'buyPrice') {
      buySize = (nValue / price).toFixed(4)
      buyPrice = nValue
    } else if (name === 'sellPrice') {
      sellSize = (nValue / price).toFixed(4)
      sellPrice = nValue
    } else if (name === 'sellSize') {
      sellPrice = (nValue * price).toFixed(1)
      if (sellPrice > buyingRange) {
        sellPrice = buyingRange
        sellTotal = buyingRange
        sellSize = nValue
      } else {
        sellPrice = sellPrice
        sellSize = nValue
        sellTotal = nValue * sellTriggerPrice
      }
    } else if (name == 'buyTriggerPrice') {
      buySize = stopMarket.buySize
      buyTriggerPrice = nValue
      buyTotal = buySize * buyTriggerPrice
    } else if (name == 'sellTriggerPrice') {
      sellSize = stopMarket.sellSize
      sellTriggerPrice = nValue
      sellTotal = sellSize * sellTriggerPrice
    }

    setStopMarket({
      ...stopMarket,
      [name]: nValue,
      buyPrice,
      sellTotal,
      buyTotal,
      buySize,
      sellPrice,
      sellSize
    })
  }

  const handleBuyRangeStopMarket = (e) => {
    const buyPrice = parseFloat(e.target.value)
    const buySize = (buyPrice / price).toFixed(4)
    const buyTriggerPrice = stopMarket.buyTriggerPrice
    setStopMarket((prev) => ({
      ...prev,
      buyPrice: buyPrice,
      buySize: buySize,
      buyTotal: (buyTriggerPrice * buySize).toFixed(1)
    }))
  }

  const handleSellRangeStopMarket = (e) => {
    const sellPrice = parseFloat(e.target.value)
    const sellSize = (sellPrice / price).toFixed(4)
    const sellTriggerPrice = stopMarket.sellTriggerPrice
    setStopMarket((prev) => ({
      ...prev,
      sellPrice: sellPrice,
      sellSize: sellSize,
      sellTotal: (sellSize * sellTriggerPrice).toFixed(1)
    }))
  }

  const stopMarketBuy = async () => {
    try {
      setBuyLoading(true)
      const res = await axios.post(`${baseURL}api/v1/limitorder`, {
        pair: pair,
        size: parseFloat(stopMarket.buySize),
        side: 'buy',
        triggerPrice: parseFloat(stopMarket.buyTriggerPrice),
        oType: 'STOP_MARKET',
        price: parseFloat(stopMarket.buyTriggerPrice),
        memonic: enMemonic,
        ordertype: stopMarket.buyTimeInForce,
        orderid: generateOrderid(6, 'StopMarketBuy'),
        time: parseFloat(stopMarket.buyTime),
        timeFrame: stopMarket.buyTimeFrame,
        reduceOnly: stopMarket.buyReduceOnly,
        postOnly: false,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')

      setStopMarket({ ...stopMarket, buyTriggerPrice: '', buySize: '', buyTime: '' })
      setBuyLoading(false)
    } catch (error) {
      setBuyLoading(false)
      console.error(error)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
    }
  }

  const stopMarketSell = async () => {
    try {
      setSellLoading(true)
      const res = await axios.post(`${baseURL}api/v1/limitorder`, {
        pair: pair,
        size: parseFloat(stopMarket.buySize),
        side: 'sell',
        triggerPrice: parseFloat(stopMarket.buyLimitPrice),
        oType: 'STOP_MARKET',
        price: parseFloat(stopMarket.buyLimitPrice),
        memonic: enMemonic,
        ordertype: stopMarket.buyTimeInForce,
        orderid: generateOrderid(6, 'StopMarketSell'),
        time: parseFloat(stopMarket.buyTime),
        timeFrame: stopMarket.buyTimeFrame,
        reduceOnly: stopMarket.buyReduceOnly,
        postOnly: stopMarket.buyPostOnly,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')

      setStopMarket({ ...stopMarket, sellTriggerPrice: '', sellSize: '', sellTime: '' })
      setSellLoading(false)
    } catch (error) {
      setSellLoading(false)
      console.error(error)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
    }
  }

  // PROFITLIMIT --------------------------------------------------------------------------------------------------------
  const [profitLimit, setProfitLimit] = useState({
    buyTriggerPrice: '',
    buyLimitPrice: '',
    buyPrice: '',
    buySize: '',
    buyTotal: '',
    buyTimeInForce: 'GTT',
    buyTime: '',
    buyTimeFrame: 'minute',
    buyReduceOnly: false,
    sellTriggerPrice: '',
    sellLimitPrice: '',
    sellPrice: '',
    sellSize: '',
    sellTotal: '',
    sellTimeInForce: 'GTT',
    sellTime: '',
    sellTimeFrame: '',
    sellReduceOnly: false
  })

  const handleProfitLimitChange = (e) => {
    const { name, value } = e.target
    const nValue = parseFloat(value)

    if (name === 'buySize' && !isNaN(nValue) && profitLimit.buyLimitPrice !== '') {
      const buyPrice = parseFloat(profitLimit.buyLimitPrice) * nValue
      if (buyPrice > buyingRange) {
        setProfitLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice: buyingRange,
          [name]: nValue,
          buyTotal: buyingRange
        }))
      } else {
        setProfitLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice,
          [name]: nValue,
          buyTotal: buyPrice
        }))
      }
    } else if (name === 'buyPrice' && !isNaN(nValue) && profitLimit.buyLimitPrice !== '') {
      let buySize = nValue / parseFloat(profitLimit.buyLimitPrice)
      buySize = buySize.toFixed(4)
      let buyPrice = nValue
      if (buyPrice > buyingRange) {
        setProfitLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice: buyingRange,
          buySize: parseFloat(buySize),
          buyTotal: buyingRange
        }))
      } else {
        setProfitLimit((prevLimit) => ({
          ...prevLimit,
          buyPrice: nValue,
          buySize,
          buyTotal: nValue
        }))
      }
    } else if (name === 'sellSize' && !isNaN(nValue) && profitLimit.sellLimitPrice !== '') {
      const sellPrice = parseFloat(profitLimit.sellLimitPrice) * nValue
      if (sellPrice > buyingRange) {
        setProfitLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice: buyingRange,
          [name]: nValue,
          sellTotal: buyingRange
        }))
      } else {
        setProfitLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice,
          [name]: nValue,
          sellTotal: sellPrice
        }))
      }
    } else if (name === 'sellPrice' && !isNaN(nValue) && profitLimit.sellLimitPrice !== '') {
      let sellSize = nValue / parseFloat(profitLimit.sellLimitPrice)
      sellSize = sellSize.toFixed(4)
      let sellPrice = nValue
      if (sellPrice > buyingRange) {
        setProfitLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice: buyingRange,
          sellSize: parseFloat(sellSize),
          sellTotal: buyingRange
        }))
      } else {
        setProfitLimit((prevLimit) => ({
          ...prevLimit,
          sellPrice: nValue,
          sellSize,
          sellTotal: nValue
        }))
      }
    } else if (name === 'buyLimitPrice' && !isNaN(nValue) && profitLimit.buySize !== '') {
      let buyPrice = parseFloat(profitLimit.buySize) * nValue
      buyPrice = buyPrice.toFixed(1)
      setProfitLimit((prevLimit) => ({
        ...prevLimit,
        buyPrice,
        [name]: nValue,
        buyTotal: buyPrice
      }))
    } else if (name === 'sellLimitPrice' && !isNaN(nValue) && profitLimit.sellSize !== '') {
      let sellPrice = parseFloat(profitLimit.sellSize) * nValue
      sellPrice = sellPrice.toFixed(1)
      setProfitLimit((prevLimit) => ({
        ...prevLimit,
        sellPrice,
        [name]: nValue,
        sellTotal: sellPrice
      }))
    } else {
      setProfitLimit((prevLimit) => ({
        ...prevLimit,
        [name]: nValue
      }))
    }
  }

  const handleBuyRangeProfitLimit = (e) => {
    const buyPrice = parseFloat(e.target.value)
    let buyLimitPrice = profitLimit.buyLimitPrice
    let buySize = (buyPrice / price).toFixed(4)
    setProfitLimit((prev) => ({
      ...prev,
      buyPrice: buyPrice,
      buySize,
      buyTotal: (buySize * buyLimitPrice).toFixed(1)
    }))
  }

  const handleSellRangeProfitLimit = (e) => {
    const sellPrice = parseFloat(e.target.value)
    let sellLimitPrice = profitLimit.sellLimitPrice
    let sellSize = (sellPrice / price).toFixed(4)
    setProfitLimit((prev) => ({
      ...prev,
      sellPrice: sellPrice,
      sellSize,
      sellTotal: (sellSize * sellLimitPrice).toFixed(1)
    }))
  }

  const profitLimitBuy = async () => {
    try {
      setBuyLoading(true)
      const res = await axios.post(`${baseURL}api/v1/limitorder`, {
        pair: pair,
        size: parseFloat(profitLimit.buySize),
        side: 'buy',
        triggerPrice: parseFloat(profitLimit.buyTriggerPrice),
        oType: 'TAKE_PROFIT_LIMIT',
        price: parseFloat(profitLimit.buyTriggerPrice),
        memonic: enMemonic,
        ordertype: profitLimit.buyTimeInForce,
        orderid: generateOrderid(6, 'profitlimitbuy'),
        time: parseFloat(profitLimit.buyTime),
        timeFrame: profitLimit.buyTimeFrame,
        reduceOnly: profitLimit.buyReduceOnly,
        postOnly: false,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')

      setProfitLimit({
        ...profitLimit,
        buyTriggerPrice: '',
        buyLimitPrice: '',
        buySize: '',
        buyTime: ''
      })
      setBuyLoading(false)
    } catch (error) {
      setBuyLoading(false)
      console.error(error)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
    }
  }

  const profitLimitSell = async () => {
    try {
      setSellLoading(true)
      const res = await axios.post(`${baseURL}api/v1/limitorder`, {
        pair: pair,
        size: parseFloat(profitLimit.sellSize),
        side: 'sell',
        triggerPrice: parseFloat(profitLimit.sellTriggerPrice),
        oType: 'TAKE_PROFIT_LIMIT',
        price: parseFloat(profitLimit.sellTriggerPrice),
        memonic: enMemonic,
        ordertype: profitLimit.sellTimeInForce,
        orderid: generateOrderid(6, 'profitLimitsell'),
        time: parseFloat(profitLimit.sellTime),
        timeFrame: profitLimit.sellTimeFrame,
        reduceOnly: profitLimit.sellReduceOnly,
        postOnly: false,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')

      setProfitLimit({
        ...profitLimit,
        sellTriggerPrice: '',
        sellLimitPrice: '',
        sellSize: '',
        sellTime: ''
      })
      setSellLoading(false)
    } catch (error) {
      setSellLoading(false)
      console.error(error)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
    }
  }

  // ProfitMarket -------------------------------------------------------------------------------------------------------
  const [profitMarket, setProfitMarket] = useState({
    buyTriggerPrice: '',
    buyPrice: '',
    buySize: '',
    buyTotal: '',
    buyTimeInForce: 'IOC',
    buyTime: '',
    buyTimeFrame: 'minute',
    buyReduceOnly: false,
    sellPrice: '',
    sellSize: '',
    sellTotal: '',
    sellTriggerPrice: '',
    sellTimeInForce: 'IOC',
    sellTime: '',
    sellTimeFrame: '',
    sellReduceOnly: false
  })

  const handleProfitMarketChange = (e) => {
    const { name, value } = e.target
    const nValue = parseFloat(value)

    let buyPrice = profitMarket.buyPrice
    let buySize = profitMarket.buySize
    let sellPrice = profitMarket.sellPrice
    let sellSize = profitMarket.sellSize
    let buyTotal = profitMarket.buyTotal
    let sellTotal = profitMarket.sellTotal
    let buyTriggerPrice = profitMarket.buyTriggerPrice
    let sellTriggerPrice = profitMarket.sellTriggerPrice

    if (name === 'buySize') {
      buyPrice = (nValue * price).toFixed(1)
      if (buyPrice > buyingRange) {
        buyPrice = buyingRange
        buySize = nValue
      } else {
        buyPrice
        buyTotal = nValue * buyTriggerPrice
        buySize = nValue
      }
    } else if (name === 'sellPrice') {
      sellPrice = nValue
      sellSize = (nValue / price).toFixed(4)
      if (sellPrice > buyingRange) {
        sellPrice = buyingRange
        sellSize = sellSize
        sellTotal = buyingRange
      } else {
        sellPrice = sellPrice
        sellSize = sellSize
        sellTotal = sellSize * sellTriggerPrice
      }
    } else if (name === 'sellSize') {
      sellPrice = nValue * price
      if (sellPrice > buyingRange) {
        sellPrice = buyingRange
        sellSize = nValue
        sellTotal = buyingRange
      } else {
        sellTotal = nValue * sellTriggerPrice
        sellSize = nValue
      }
    } else if (name === 'buyTriggerPrice') {
      buyTotal = (buySize * nValue).toFixed(1)
      buyTriggerPrice = nValue
    } else if (name === 'sellTriggerPrice') {
      sellTotal = (sellSize * nValue).toFixed(1)
      sellTriggerPrice = nValue
    }

    setProfitMarket({
      ...profitMarket,
      buyPrice,
      buySize,
      sellPrice,
      sellSize,
      buyTotal,
      buyTriggerPrice,
      sellTriggerPrice,
      sellTotal,
      [name]: nValue
    })
  }

  const handleBuyRangeProfitMarket = (e) => {
    let buyPrice = parseFloat(e.target.value)
    buyPrice = buyPrice.toFixed(1)
    const buySize = parseFloat(buyPrice / price).toFixed(4)
    const buyTriggerPrice = profitMarket.buyTriggerPrice
    const buyTotal = (buyTriggerPrice * buySize).toFixed(1)
    setProfitMarket((prev) => ({
      ...prev,
      buyPrice: buyPrice,
      buySize: buySize,
      buyTotal: buyTotal
    }))
  }

  const handleSellRangeProfitMarket = (e) => {
    let sellPrice = parseFloat(e.target.value)
    sellPrice = sellPrice.toFixed(1)
    const sellSize = parseFloat(sellPrice / price).toFixed(4)
    const sellTriggerPrice = profitMarket.sellTriggerPrice
    const sellTotal = (sellTriggerPrice * sellSize).toFixed(1)
    setProfitMarket((prev) => ({
      ...prev,
      sellPrice: sellPrice,
      sellSize: sellSize,
      sellTotal: sellTotal
    }))
  }

  const profitMarketBuy = async () => {
    try {
      setBuyLoading(true)
      const res = await axios.post(`${baseURL}api/v1/limitorder`, {
        pair: pair,
        size: parseFloat(profitMarket.buySize),
        side: 'buy',
        triggerPrice: parseFloat(profitMarket.buyTriggerPrice),
        oType: 'TAKE_PROFIT_MARKET',
        price: parseFloat(profitMarket.buyPrice),
        memonic: enMemonic,
        ordertype: profitMarket.buyTimeInForce,
        orderid: generateOrderid(6, 'proftmarketbuy '),
        time: parseFloat(profitMarket.buyTime),
        timeFrame: profitMarket.buyTimeFrame,
        reduceOnly: profitMarket.buyReduceOnly,
        postOnly: false,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')

      setProfitMarket({ ...profitMarket, buyTriggerPrice: '', buySize: '', buyTime: '' })
      setBuyLoading(false)
    } catch (error) {
      setBuyLoading(false)
      console.error(error)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
    }
  }

  const profitMarketSell = async () => {
    try {
      setSellLoading(true)
      const res = await axios.post(`${baseURL}api/v1/limitorder`, {
        pair: pair,
        size: parseFloat(profitMarket.sellSize),
        side: 'sell',
        triggerPrice: parseFloat(profitMarket.sellTriggerPrice),
        oType: 'TAKE_PROFIT_MARKET',
        price: parseFloat(profitMarket.sellPrice),
        memonic: enMemonic,
        ordertype: profitMarket.sellTimeInForce,
        orderid: generateOrderid(6, 'proftmarketsell'),
        time: parseFloat(profitMarket.sellTime),
        timeFrame: profitMarket.sellTimeFrame,
        reduceOnly: profitMarket.sellReduceOnly,
        postOnly: false,
        network: server
      })
      const data = res.data
      showToast(data.message, 'success')

      setProfitMarket({ ...profitMarket, sellTriggerPrice: '', sellSize: '', sellTime: '' })
      setSellLoading(false)
    } catch (error) {
      setSellLoading(false)
      console.error(error)
      showToast(`Error placing order ${error.response.data.message}`, 'error')
    }
  }


  //  function to change the tabs of components  (limit,market,copyBot,gridBot)
  const handleTabItemClick = (index) => {
    if (websocketRef.current != null) {
      showToast('Copy Bot is active. Please stop before switching tabs.', 'warning')
      return
    }

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

  return (
    <>
      <div className="tabs-wrapper">
        {tabs.map((tab, index) => (
          <button
            key={index}
            type="button"
            className={`tab-item ${index === 0 ? 'active' : ''}`}
            ref={(el) => (tabRefs.current[index] = el)}
            onClick={() => handleTabItemClick(index)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-container">
        <div id="spot">
          {/* ------------------------------------ Limit ------------------------------------ */}
          {tabIndex == 0 && (
            <Limit
              name={name}
              handleLimitChange={handleLimitChange}
              handleBuyRangeLimit={handleBuyRangeLimit}
              handleSellRangeLimit={handleSellRangeLimit}
              buyLoading={buyLoading}
              sellLoading={sellLoading}
              limit={limit}
              setLimit={setLimit}
              buyingRange={buyingRange}
              limitBuy={limitBuy}
              limitSell={limitSell}
            />
          )}

          {/* ------------------------------------ Market ------------------------------------ */}
          {tabIndex == 1 && (
            <Market
              name={name}
              market={market}
              setMarket={setMarket}
              handleMarket={handleMarket}
              marketBuy={marketBuy}
              marketSell={marketSell}
              sellLoading={sellLoading}
              buyLoading={buyLoading}
              handleBuyRangeMarket={handleBuyRangeMarket}
              handleSellRangeMarket={handleSellRangeMarket}
              buyingRange={buyingRange}
            />
          )}

          {/* ------------------------------------ Grid Bot ------------------------------------ */}
          {tabIndex == 2 && (
            <GridBotForm
              gridBot={gridBot}
              setGridBot={setGridBot}
              handleGridChange={handleGridChange}
              handleClick={handleClick}
              buyingRange={buyingRange}
            />
          )}

          {/* ----------------------------------- Copy Trade Bot ----------------------------------- */}
          {tabIndex == 3 && <CopyTradeBot ref={websocketRef} />}

          {/* ------------------------------------ Stop Limit ------------------------------------ */}
          {/* {tabIndex == 3 && (
            <StopLimit
              name={name}
              handleStopLimitChange={handleStopLimitChange}
              handleBuyRangeStopLimit={handleBuyRangeStopLimit}
              handleSellRangeStopLimit={handleSellRangeStopLimit}
              buyLoading={buyLoading}
              sellLoading={sellLoading}
              stopLimit={stopLimit}
              setStopLimit={setStopLimit}
              buyingRange={buyingRange}
              stopLimitBuy={stopLimitBuy}
              stopLimitSell={stopLimitSell}
            />
          )} */}

          {/* ------------------------------------ Stop Market ------------------------------------ */}
          {/* {tabIndex == 4 && (
            <StopMarket
              name={name}
              handleStopMarketChange={handleStopMarketChange}
              handleBuyRangeStopMarket={handleBuyRangeStopMarket}
              handleSellRangeStopMarket={handleSellRangeStopMarket}
              buyLoading={buyLoading}
              sellLoading={sellLoading}
              stopMarket={stopMarket}
              setStopMarket={setStopMarket}
              buyingRange={buyingRange}
              stopMarketBuy={stopMarketBuy}
              stopMarketSell={stopMarketSell}
            />
          )} */}

          {/* ------------------------------------ Take Profit Limit ------------------------------------ */}
          {/* {tabIndex == 5 && (
            <TakeProfitLimit
              name={name}
              profitLimit={profitLimit}
              setProfitLimit={setProfitLimit}
              handleProfitLimitChange={handleProfitLimitChange}
              handleBuyRangeProfitLimit={handleBuyRangeProfitLimit}
              handleSellRangeProfitLimit={handleSellRangeProfitLimit}
              buyLoading={buyLoading}
              sellLoading={sellLoading}
              buyingRange={buyingRange}
              profitLimitBuy={profitLimitBuy}
              profitLimitSell={profitLimitSell}
            />
          )} */}

          {/* ------------------------------------ Take Profit Market ------------------------------------ */}
          {/* {tabIndex == 6 && (
            <TakeProfitMarket
              name={name}
              profitMarket={profitMarket}
              setProfitMarket={setProfitMarket}
              handleProfitMarketChange={handleProfitMarketChange}
              profitMarketBuy={profitMarketBuy}
              profitMarketSell={profitMarketSell}
              buyLoading={buyLoading}
              sellLoading={sellLoading}
              handleBuyRangeProfitMarket={handleBuyRangeProfitMarket}
              handleSellRangeProfitMarket={handleSellRangeProfitMarket}
              buyingRange={buyingRange}
            />
          )} */}
        </div>
      </div>
    </>
  )
}

export default BuySell
