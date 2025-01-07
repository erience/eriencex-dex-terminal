import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectData } from '../redux-toolkit/dataSlice'

const GridRangesModal = ({ gridRanges, index, newObject }) => {
  const { gridSettings } = useSelector(selectData)
  const slippage = gridSettings?.[index]?.slippage
  const profitPercentage = gridSettings?.[index]?.profitPercentage
  const [feesAndProfits, setFeesAndProfits] = useState([])

  useEffect(() => {
    setFeesAndProfits(newObject)
  }, [newObject])

  return (
    <>
      <dialog id="grid_ranges" className="modal bg-black/[0.5]">
        <div className="modal-box max-h-[600px] max-w-[1500px]">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-3 top-4 z-10"
            onClick={() => document.getElementById('grid_ranges').close()}
          >
            ✕
          </button>
          <h3 className="font-bold text-lg mb-2">Grid Ranges</h3>
          <div className="overflow-x-auto max-h-[400px] vertical-thin">
            <table className="table-auto border-collapse border border-gray-300 w-full text-left">
              <thead className="sticky top-0 bg-dark z-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2">Grids</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Adjusted Lower Buying Range (with Slippage)
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Take Profit (Adjusted for Lower Slippage Range)
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Adjusted Upper Buying Range (with Slippage)
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Take Profit (Adjusted for Upper Slippage Range)
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Total Fees</th>
                  <th className="border border-gray-300 px-4 py-2">Total Profit</th>
                  <th className="border border-gray-300 px-4 py-2">Total Buy Order</th>
                  <th className="border border-gray-300 px-4 py-2">Total Sell Order</th>
                  <th className="border border-gray-300 px-4 py-2">Fee Type Maker</th>
                  <th className="border border-gray-300 px-4 py-2">Fee Type Taker</th>
                  <th className="border border-gray-300 px-4 py-2">Sell Order Filled</th>
                </tr>
              </thead>
              <tbody>
                {gridRanges.length > 0 ? (
                  gridRanges.map((data, i) => {
                    const value = Number(data)
                    const reducedValue = value - (value * Number(slippage)) / 100
                    const takeProfit1 =
                      reducedValue * (Number(profitPercentage) / 100) + reducedValue
                    const increasedValue = value + (value * Number(slippage)) / 100
                    const takeProfit2 =
                      increasedValue * (Number(profitPercentage) / 100) + increasedValue

                    const fees = newObject && newObject[i]
                      ? `$${Number(newObject[i].totalFees).toFixed(4)}`
                      : '-';
                    const profit = newObject && newObject[i]
                      ? `$${Number(newObject[i].profit).toFixed(6)}`
                      : '-';
                    const totalBuyOrder = newObject && newObject[i]
                      ? newObject[i].totalBuyOrder
                      : '-';
                    const totalSellOrder = newObject && newObject[i]
                      ? newObject[i].totalSellOrder
                      : '-';
                    const feeTypeMaker = newObject && newObject[i]
                      ? newObject[i].feeTypeMaker
                      : '-';
                    const feeTypeTaker = newObject && newObject[i]
                      ? newObject[i].feeTypeTaker
                      : '-';
                    const sellOrderFilled = newObject && newObject[i]
                      ? newObject[i].sellOrderFilled
                      : '-';


                    return (
                      <tr key={i}>
                        <td className="border border-gray-300 px-4 py-2">{value.toFixed(3)}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {reducedValue.toFixed(3)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {takeProfit1.toFixed(3)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {increasedValue.toFixed(3)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {takeProfit2.toFixed(3)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{fees}</td>
                        <td className="border border-gray-300 px-4 py-2">{profit}</td>
                        <td className="border border-gray-300 px-4 py-2">{totalBuyOrder}</td>
                        <td className="border border-gray-300 px-4 py-2">{totalSellOrder}</td>
                        <td className="border border-gray-300 px-4 py-2">{feeTypeMaker}</td>
                        <td className="border border-gray-300 px-4 py-2">{feeTypeTaker}</td>
                        <td className="border border-gray-300 px-4 py-2">{sellOrderFilled}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="border border-gray-300 px-4 py-2 text-center">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  )
}

export default GridRangesModal
