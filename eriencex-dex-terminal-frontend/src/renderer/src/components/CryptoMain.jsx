import React from 'react'
import CryptoInfo from './CryptoInfo'
import OrderBook from './OrderBook'
import CandleChart from './CandleChart'

const CryptoMain = () => {
  return (
    <>
      <div className="relative col-span-12 xxl:col-span-9">
        <div className="grid grid-cols-12">
          <CryptoInfo />
          <OrderBook />
          <CandleChart />
        </div>
      </div>
    </>
  )
}

export default CryptoMain
