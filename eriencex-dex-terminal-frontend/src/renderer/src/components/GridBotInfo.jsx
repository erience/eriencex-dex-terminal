import React, { useEffect, useState } from 'react'
import { showToast } from '../utils/helper'
import EditGridModal from './EditGridModal'
import { FaEdit } from 'react-icons/fa'
import { FaEye } from 'react-icons/fa6'
import GridRangesModal from './GridRangesModal'
import { useDispatch, useSelector } from 'react-redux'
import { selectData, setGridSettings, setJsonData } from '../redux-toolkit/dataSlice'

const GridBotInfo = ({ subAccNo }) => {
  const { gridSettings, pair, cryptoPair, chainAddress, baseURL, openOrderData, jsonData } =
    useSelector(selectData)
  const [price, setPrice] = useState(0)
  const [editIndex, setEditIndex] = useState(0)
  const [gridRanges, setGridRanges] = useState([])
  const [isBotClosed, setIsBotClosed] = useState(false)
  const [newObject, setNewObject] = useState({})
  const [buyOrders, setBuyOrders] = useState([])
  const [sellOrders, setSellOrders] = useState([])
  const dispatch = useDispatch()

  const getJSONData = async () => {
    const db = await window.electron.getDBData()
    // console.log('db data', db)
    setBuyOrders(db.orders)
    setSellOrders(db.Limitorders)
    processOrders(db.orders, db.Limitorders)
  }

  const processOrders = (buyOrders, sellOrders) => {
    const updatedObject = { ...newObject }

    // Process buy orders
    buyOrders.forEach((order) => {
      if (!updatedObject[order.gridindex]) {
        updatedObject[order.gridindex] = {
          totalBuyOrder: 0,
          totalSellOrder: 0,
          totalFees: 0,
          feeTypeMaker: 0,
          feeTypeTaker: 0,
          sellOrderFilled: 0,
          profit: 0
        }
      }
      const gridData = updatedObject[order.gridindex]
      gridData.totalBuyOrder += 1
      gridData.totalFees += Number(order.fee) || 0
      if (order.liquidityType === 'MAKER') {
        gridData.feeTypeMaker += 1
      } else if (order.liquidityType === 'TAKER') {
        gridData.feeTypeTaker += 1
      }
    })

    // Process sell orders
    sellOrders.forEach((order) => {
      const buyOrder = buyOrders.find((o) => o.systemId === order.limitOrderAgainOrderId)
      if (buyOrder) {
        const gridData = updatedObject[buyOrder.gridindex]
        gridData.totalSellOrder += 1
        gridData.totalFees += Number(order.fee) || 0
        if (order.liquidityType === 'MAKER') {
          gridData.feeTypeMaker += 1
        } else if (order.liquidityType === 'TAKER') {
          gridData.feeTypeTaker += 1
        }
        if (!order.isOrderOpen && order.limitOrderClosed) {
          const profit = Number(order.triggerPrice) - Number(order.priceBoughtOn)
          gridData.profit += profit
          gridData.sellOrderFilled += 1
        }
      }
    })

    setNewObject(updatedObject)
  }

  useEffect(() => {
    getJSONData()
    const intervalId = setInterval(() => {
      getJSONData()
    }, 5000)

    return () => clearInterval(intervalId)
  }, [])

  const closeGrid = async (index) => {
    setIsBotClosed(true)
    await window.electron.closeGridBot(index)
    if (openOrderData.length > 0) {
      showToast('Wait while closing all open orders', 'info')
      await window.electron.cancelAllOrders(openOrderData)
    }
    const jsonData = await window.electron.getDBData()
    dispatch(setJsonData(jsonData))
    showToast('Grid bot closed', 'success')
    setIsBotClosed(false)
  }

  const calculateGrid = (from, to, gridRange) => {
    const ranges = []
    for (let i = from; i <= to; i += gridRange) {
      ranges.push(i)
    }
    setGridRanges(ranges)
  }

  const calculateCurrentPrice = (ticker) => {
    if (cryptoPair.length > 0) {
      const currentTickerInfo = cryptoPair.filter((p) => p.ticker == ticker)
      const currentPrice = parseFloat(currentTickerInfo[0]?.oraclePrice)
      return currentPrice
    }
  }

  const startGrid = async (grid, index) => {
    if (price) {
      await window.electron.startGridBot(index)
      const currentPrice = calculateCurrentPrice(grid.pair)
      const tradePrice = Number(grid.dollars) / Number(grid.totalGrid)
      const finalSize = tradePrice / currentPrice
      const jsonData = await window.electron.getDBData()
      dispatch(setJsonData(jsonData))

      if (chainAddress) {
        console.log('in call sub websocket')
        await window.electron.startSubAccWebSocket(chainAddress, finalSize, baseURL, grid)
      }
      setTimeout(async () => {
        console.log('in call websocket')
        await window.electron.startWebSocket(grid.pair, finalSize, baseURL)
      }, 3000)
      showToast('Grid bot started', 'success')
    }
  }

  const handleEdit = (index) => {
    setEditIndex(index)
    document.getElementById('edit_grid_info').showModal()
  }

  const handleGridRanges = (gridData, index) => {
    const difference = Number(gridData.to) - Number(gridData.from)
    const gridRange = difference / Number(gridData.totalGrid)
    calculateGrid(Number(gridData.from), Number(gridData.to), gridRange)
    setEditIndex(index)
    document.getElementById('grid_ranges').showModal()
  }

  const clearDB = async () => {
    await window.electron.clearJSON()
    showToast('CacheData cleared successfully', 'success')
  }

  useEffect(() => {
    if (cryptoPair.length > 0) {
      const price = cryptoPair.filter((p) => p.ticker == pair)
      setPrice(price[0]?.oraclePrice)
    }
  }, [cryptoPair])

  useEffect(() => {
    if (jsonData) {
      dispatch(setGridSettings(jsonData?.allGridSettings))
    }
  }, [jsonData])

  return (
    <>
      <div className="relative w-full h-64 overflow-x-auto vertical-thin">
        <table className="table w-full whitespace-nowrap text-left align-middle">
          <thead>
            <tr className="sticky top-0 bg-dark border-b border-gray-800">
              <th className="text-xs text-white font-light py-3 px-1">Ticker</th>
              <th className="text-xs text-white font-light py-3 px-1">Slippage</th>
              <th className="text-xs text-white font-light py-3 px-1">Take Profit %</th>
              <th className="text-xs text-white font-light py-3 px-1">Number of Grids</th>
              <th className="text-xs text-white font-light py-3 px-1">View Grids</th>
              <th className="text-xs text-white font-light py-3 px-1">Bot Status</th>
              <th className="text-xs text-white font-light py-3 px-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {gridSettings?.length === 0 || subAccNo === null ? (
              <tr>
                <td colSpan="6">
                  <div className="w-full h-56 flex items-center justify-center">
                    <p className="text-xs text-gray-400">
                      {subAccNo === null ? 'No data available' : 'You have no open grid right now'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              gridSettings.map((grid, index) => (
                <tr key={index}>
                  <td>{grid.pair}</td>
                  <td>{grid.slippage}</td>
                  <td>{grid.profitPercentage}</td>
                  <td>{grid.totalGrid}</td>
                  <td>
                    <button
                      className="btn cursor-pointer"
                      onClick={() => handleGridRanges(grid, index)}
                    >
                      <FaEye />
                    </button>
                  </td>
                  <td>{grid.isGridActive ? 'Running' : 'Stopped'}</td>
                  <td>
                    {grid.isGridActive ? (
                      <button
                        className="btn cursor-pointer me-1"
                        disabled={isBotClosed}
                        onClick={() => closeGrid(index)}
                      >
                        x
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button className="btn cursor-pointer" onClick={() => handleEdit(index)}>
                          <FaEdit />
                        </button>
                        <button
                          className="btn cursor-pointer"
                          onClick={() => startGrid(grid, index)}
                        >
                          start
                        </button>
                        <button className="btn" onClick={clearDB}>
                          clear cache
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <EditGridModal index={editIndex} />
        <GridRangesModal gridRanges={gridRanges} index={editIndex} newObject={newObject} />
      </div>
    </>
  )
}

export default GridBotInfo
