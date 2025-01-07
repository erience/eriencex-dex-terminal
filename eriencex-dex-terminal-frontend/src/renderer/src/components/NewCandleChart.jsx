import React, { useEffect, useRef } from 'react'
import { formatPairName } from '../utils/helper'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'

const NewCandleChart = () => {
  const containerRef = useRef()
  const scriptRef = useRef(null)
  const { pair } = useSelector(selectData)

  const formatPair = (pair) => {
    const baseCurrency = formatPairName(pair)?.split('-')[0]
    return baseCurrency + 'USDT'
  }

  const chartConfig = {
    autosize: true,
    symbol: `binance:${formatPair(pair)}`,
    timezone: 'Etc/UTC',
    interval: '1',
    theme: 'dark',
    style: '1',
    locale: 'en',
    hide_top_toolbar: false,
    withdateranges: true,
    hide_side_toolbar: false,
    allow_symbol_change: true,
    calendar: false,
    support_host: 'https://www.tradingview.com',
    backgroundColor: 'rgb(22,26,30)'
  }

  const cleanup = () => {
    if (scriptRef.current) {
      scriptRef.current.remove()
      scriptRef.current = null
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }
  }

  useEffect(() => {
    const injectScript = () => {
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
      script.type = 'text/javascript'
      script.async = true
      const options = { ...chartConfig }
      const serializedOptions = JSON.stringify(options, null, 2)
      script.innerHTML = `${serializedOptions}`

      if (containerRef.current) {
        containerRef.current.appendChild(script)
        scriptRef.current = script
      }
    }

    cleanup()
    const timeout = setTimeout(() => {
      injectScript()
    }, 500)

    return () => {
      cleanup()
      clearTimeout(timeout)
    }
  }, [pair])

  return (
    <div className="relative h-[500px]">
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: '100%', width: '100%' }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: 'calc(100% - 32px)', width: '100%' }}
        ></div>
      </div>
    </div>
  )
}

export default NewCandleChart
