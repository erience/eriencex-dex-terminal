import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectData, setJsonData } from '../redux-toolkit/dataSlice'

const EditGridModal = ({ index }) => {
  const { gridSettings } = useSelector(selectData)
  const dispatch = useDispatch()
  let initialstate = {
    from: '',
    to: '',
    dollars: '',
    totalGrid: '',
    slippage: '',
    profitPercentage: '',
    isGridActive: false
  }
  const [gridBot, setGridBot] = useState(initialstate)

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

  const handleGridChange = (e) => {
    setGridBot({ ...gridBot, [e.target.name]: e.target.value })
  }

  const handleEdit = async () => {
    if (JSON.stringify(gridSettings[index]) != JSON.stringify(gridBot)) {
      console.log('edit called')
      await window.electron.updateDBData(index, gridBot)
      const res = await window.electron.getDBData()
      dispatch(setJsonData(res))
      await window.electron.clearJSON(gridSettings[index].gridId)
    }
    document.getElementById('edit_grid_info').close()
  }

  useEffect(() => {
    if (index != null) {
      setGridBot(gridSettings[index])
    }
  }, [index])

  return (
    <>
      <dialog id="edit_grid_info" className="modal bg-black/[0.5]">
        <div className="modal-box grid-modal">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-3 top-4 z-10"
            onClick={() => document.getElementById('edit_grid_info').close()}
          >
            ✕
          </button>
          <div className="relative mb-8">
            <h3 className="font-bold text-lg">Edit Grid</h3>
          </div>

          <div className="relative grid gap-2 grid-cols-12">
            <div className="relative col-span-6">
              <div
                className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center cursor-pointer"
                onClick={() => focusInput('from')}
              >
                <span className="py-2 px-3 text-gray-400">From</span>
                <input
                  ref={(el) => (inputRefs.current.from = el)}
                  type="number"
                  value={gridBot?.from}
                  placeholder="$0.0"
                  name="from"
                  onChange={handleGridChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">USDT</span>
              </div>
            </div>
            <div className="relative col-span-6">
              <div
                className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center cursor-pointer"
                onClick={() => focusInput('to')}
              >
                <span className="py-2 px-3 text-gray-400">To</span>
                <input
                  ref={(el) => (inputRefs.current.to = el)}
                  type="number"
                  value={gridBot?.to}
                  placeholder="$0.0"
                  name="to"
                  onChange={handleGridChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">USDT</span>
              </div>
            </div>

            <div className="relative col-span-6">
              <div
                className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center cursor-pointer"
                onClick={() => focusInput('dollars')}
              >
                <span className="py-2 px-3 text-gray-400">Amount</span>
                <input
                  ref={(el) => (inputRefs.current.dollars = el)}
                  type="number"
                  value={gridBot?.dollars}
                  placeholder="$0.0"
                  name="dollars"
                  onChange={handleGridChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">USDT</span>
              </div>
            </div>

            <div className="relative col-span-6">
              <div
                className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center cursor-pointer"
                onClick={() => focusInput('totalGrid')}
              >
                <span className="py-2 px-3 text-gray-400">Number of Grids</span>
                <input
                  ref={(el) => (inputRefs.current.totalGrid = el)}
                  type="number"
                  value={gridBot?.totalGrid}
                  placeholder="0.0"
                  name="totalGrid"
                  onChange={handleGridChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">USDT</span>
              </div>
            </div>

            <div className="realative col-span-6">
              <div
                className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center cursor-pointer"
                onClick={() => focusInput('slippage')}
              >
                <span className="py-2 px-3 text-gray-400">Slippage</span>
                <input
                  ref={(el) => (inputRefs.current.slippage = el)}
                  type="number"
                  value={gridBot?.slippage}
                  placeholder="0.0%"
                  name="slippage"
                  onChange={handleGridChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">%</span>
              </div>
            </div>

            <div className="relative col-span-6">
              <div
                className="relative w-full h-11 rounded-md bg-[#2A2D35] flex items-center justify-center cursor-pointer"
                onClick={() => focusInput('profitPercentage')}
              >
                <span className="py-2 px-3 text-gray-400">Profit Percentage</span>
                <input
                  type="number"
                  ref={(el) => (inputRefs.current.profitPercentage = el)}
                  value={gridBot?.profitPercentage}
                  placeholder="0.0%"
                  name="profitPercentage"
                  onChange={handleGridChange}
                  className="flex-1 w-full h-full p-2 border-0 outline-none bg-transparent text-end"
                />
                <span className="py-2 px-3">%</span>
              </div>
            </div>

            <div className="relative col-span-12">
              <button
                type="button"
                className="relative inline-block w-full h-full min-h-11 bg-[#11e7b0] hover:bg-[#14b38a]  text-white rounded-md"
                onClick={handleEdit}
              >
                Update
              </button>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  )
}

export default EditGridModal
