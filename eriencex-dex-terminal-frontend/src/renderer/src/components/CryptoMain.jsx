import React, { useRef, useState } from 'react'
import CryptoInfo from './CryptoInfo'
import OrderBook from './OrderBook'
import CandleChart from './CandleChart'
import MarketTrades from './MarketTrades'

const CryptoMain = () => {
  const [tabIndex, setTabIndex] = useState(0)

  const tabRefs = useRef([])

  const tabs = [
    'OrderBook',
    'Market Trades'
  ]

  const handleTabItemClick = (index) => {
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
      <div className="relative col-span-12 xxl:col-span-12">
        <div className="grid grid-cols-12">
          <CryptoInfo />
          <div className="col-span-3">
            <div className="tab-container !bg-transparent !p-0">
              <div className="tabs-wrapper">
                {tabs.map((tab, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`tab-item !p-2.5 w-1/2 ${index === 0 ? 'active' : ''}`}
                    ref={(el) => (tabRefs.current[index] = el)}
                    onClick={() => handleTabItemClick(index)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className='relative w-full max-h-[756px] overflow-y-auto vertical-thin'>
                <div className={tabIndex === 0 ? "block" : "hidden"}>
                  <OrderBook />
                </div>
                <div className={tabIndex === 1 ? "block" : "hidden"}>
                  <MarketTrades />
                </div>
              </div>
            </div>
          </div>
          <CandleChart />
        </div>
      </div>
    </>
  )
}

export default CryptoMain
