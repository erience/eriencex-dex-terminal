import React, { useRef } from 'react'
import { FaInfoCircle } from 'react-icons/fa'
import AboutGridBotModal from './AboutGridBotModal'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'

const GridBotForm = ({ gridBot, handleGridChange, handleClick, buyingRange }) => {
  const { freeCollateral } = useSelector(selectData)
  const inputRefs = useRef({
    from: null,
    to: null,
    dollars: null,
    totalGrid: null,
    slippage: null,
    profitPercentage: null
  })

  const focusInput = (inputName) => {
    if (inputRefs.current[inputName]) {
      inputRefs.current[inputName].focus()
    }
  }

  return (
    <>
      <div className="relative grid grid-cols-12 gap-5">
        <div
          onClick={() => document.getElementById('about_gridbot').showModal()}
          className="col-span-12 flex gap-1 items-center justify-end cursor-pointer"
        >
          <h5 className="text-xs">Instructions</h5>
          <button>
            <FaInfoCircle />
          </button>
        </div>
        <div className="relative flex justify-between col-span-12">
          <div className="text-xs text-gray-400">
            Avbl
            <span className="text-white mx-1">{freeCollateral.toFixed()} USDT</span>
          </div>
          <div className="text-xs text-gray-400">
            BuyingPower
            <span className="text-white mx-1">{buyingRange} USDT</span>
          </div>
        </div>
        <div className="relative grid gap-4 col-span-12">
          <div className="relative col-span-2">
            <div
              className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
              onClick={() => focusInput('from')}
            >
              <span className="py-2 px-3 text-gray-400 cursor-pointer">From</span>
              <input
                ref={(el) => (inputRefs.current.from = el)}
                type="number"
                value={gridBot.from}
                placeholder="$0.0"
                name="from"
                onChange={handleGridChange}
                className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
              />
              <span className="py-2 px-3">USDT</span>
            </div>
          </div>
          <div className="relative col-span-2">
            <div
              className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
              onClick={() => focusInput('to')}
            >
              <span className="py-2 px-3 text-gray-400 cursor-pointer">To</span>
              <input
                ref={(el) => (inputRefs.current.to = el)}
                type="number"
                value={gridBot.to}
                placeholder="$0.0"
                name="to"
                onChange={handleGridChange}
                className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
              />
              <span className="py-2 px-3">USDT</span>
            </div>
          </div>

          <div className="relative col-span-2">
            <div
              className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
              onClick={() => focusInput('dollars')}
            >
              <span className="py-2 px-3 text-gray-400 cursor-pointer">Amount to Invest</span>
              <input
                ref={(el) => (inputRefs.current.dollars = el)}
                type="number"
                value={gridBot.dollars}
                placeholder="$0.0"
                name="dollars"
                onChange={handleGridChange}
                className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
              />
              <span className="py-2 px-3">USDT</span>
            </div>
          </div>

          <div className="relative col-span-2">
            <div
              className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
              onClick={() => focusInput('totalGrid')}
            >
              <span className="py-2 px-3 text-gray-400 cursor-pointer">Number of Grids</span>
              <input
                ref={(el) => (inputRefs.current.totalGrid = el)}
                type="number"
                value={gridBot.totalGrid}
                placeholder="0.0"
                name="totalGrid"
                onChange={handleGridChange}
                className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
              />
              <span className="py-2 px-3">GRIDS</span>
            </div>
          </div>

          <div className="realative col-span-2">
            <div
              className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
              onClick={() => focusInput('slippage')}
            >
              <span className="py-2 px-3 text-gray-400 cursor-pointer">Slippage</span>
              <input
                ref={(el) => (inputRefs.current.slippage = el)}
                type="number"
                value={gridBot.slippage}
                placeholder="0.0%"
                name="slippage"
                onChange={handleGridChange}
                className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
              />
              <span className="py-2 px-3">%</span>
            </div>
          </div>

          <div className="relative col-span-2">
            <div
              className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center"
              onClick={() => focusInput('profitPercentage')}
            >
              <span className="py-2 px-3 text-gray-400 cursor-pointer">Take Profit Percentage</span>
              <input
                ref={(el) => (inputRefs.current.profitPercentage = el)}
                type="number"
                value={gridBot.profitPercentage}
                placeholder="0.0%"
                name="profitPercentage"
                onChange={handleGridChange}
                className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
              />
              <span className="py-2 px-3">%</span>
            </div>
          </div>

          <div className="relative col-span-4">
            <button
              type="button"
              className="relative inline-block w-full h-full min-h-11 bg-[#11e7b0] hover:bg-[#14b38a]  text-white rounded-md"
              onClick={handleClick}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
      <AboutGridBotModal />
    </>
  )
}

export default GridBotForm
