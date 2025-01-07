import React, { createContext, useEffect, useRef, useState } from 'react'
import Chart from './Chart'
import Series from './Series'
import BuySell from './BuySell'
import moment from 'moment'
import NewCandleChart from './NewCandleChart'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'
import OrdersAndPositions from './OrdersAndPositions'

export const Context = createContext()

const CandleChart = (props) => {
  const {
    colors: {
      backgroundColor = '#1E2026',
      candleColor = {
        upColor: '#11e7b0',
        downColor: '#ff4976',
        borderDownColor: '#ff4976',
        borderUpColor: '#11e7b0',
        wickDownColor: '#838383',
        wickUpColor: '#11e7b0'
      },
      textColor = 'white'
    } = {}
  } = props

  const { pair, webSocketURL, server } = useSelector(selectData)

  const [chartLayoutOptions, setChartLayoutOptions] = useState({})
  const series1 = useRef(null)
  const [candlesData, setCandlesData] = useState([])
  const [webSocketConnected, setWebSocketConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const webSocketRef = useRef(null)

  const getData = async () => {
    try {
      setLoading(true)
      const apiUrl = `https://indexer.dydx.trade/v4/candles/perpetualMarkets/${pair}?resolution=1MIN&limit=100`
      const res = await fetch(apiUrl)
      const resdata = await res.json()
      const candles = resdata.candles.map((candle) => {
        return {
          time: moment(candle.startedAt).unix(),
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close)
        }
      })
      const reverse = candles.reverse()
      setCandlesData(reverse)
      setLoading(false)
      // connectWebSocket()
    } catch (err) {
      console.error('error fetching data', err)
    }
  }

  useEffect(() => {
    getData()
    return () => {
      webSocketRef?.current && webSocketRef?.current?.close()
    }
  }, [pair, webSocketURL, server])

  const connectWebSocket = async () => {
    const webSocket = new WebSocket(webSocketURL)
    webSocketRef.current = webSocket
    webSocket.onopen = function (event) {
      setWebSocketConnected(true)
      const params = {
        type: 'subscribe',
        channel: 'v4_candles',
        ticker: pair,
        id: `${pair}/1MIN`
      }
      webSocket.send(JSON.stringify(params))
    }

    webSocket.onmessage = function (event) {
      const responseData = JSON.parse(event.data)
      if (responseData.channel === 'v4_candles') {
        const candle = responseData.contents
        if (!candle?.candles) {
          updateChart(candle)
        }
      }
    }

    webSocket.onerror = function (event) {
      console.error('WebSocket encountered error:', event)
    }

    webSocket.onclose = function (event) {
      console.log('WebSocket connection closed.')
    }

    return () => {
      webSocket.close()
    }
  }

  const updateChart = (candle) => {
    if (candle && Object.keys(candle).length > 0) {
      const formattedCandle = {
        time: moment(candle.startedAt).unix(),
        open: parseFloat(candle?.open),
        high: parseFloat(candle?.high),
        low: parseFloat(candle?.low),
        close: parseFloat(candle?.close)
      }
      series1.current.update(formattedCandle)
    }
  }

  useEffect(() => {
    setChartLayoutOptions({
      background: {
        color: backgroundColor
      },
      textColor,
      grid: {
        vertLines: { color: '#000' },
        horzLines: { color: '#000' }
      }
    })
  }, [backgroundColor, textColor])

  return (
    <>
      <div className="relative col-span-12 xxl:col-span-9">
        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-8">
            {candlesData?.length > 0 && !loading ? (
              <div className="relative w-full h-full">
                {/* <Chart layout={chartLayoutOptions}>
              <Series ref={series1} type="candlestick" data={candlesData} color={candleColor} />
            </Chart> */}
                <NewCandleChart />
                {/* <div className="relative w-full">
                  <BuySell />
                </div> */}
              </div>
            ) : (
              <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                  <span className="sr-only"></span>
                </div>
              </div>
            )}
          </div>
          <div className="col-span-12 lg:col-span-4">
            <div className='relative w-full h-[500px] overflow-y-auto vertical-thin'>
              <BuySell />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-12">
            <OrdersAndPositions />
          </div>
        </div>
      </div>
    </>
  )
}

export default CandleChart
