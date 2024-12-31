import React, { useEffect, useState } from 'react'
import axios from 'axios'
import CryptoMain from './CryptoMain'
import Markets from './Markets'
import OrdersAndPositions from './OrdersAndPositions'
import { useDispatch, useSelector } from 'react-redux'
import { selectData, setBlockHeight, setJsonData } from '../redux-toolkit/dataSlice'

const TradeMain = () => {
  const { blockHeight, jsonData } = useSelector(selectData)
  const [counter, setCounter] = useState(0)
  const dispatch = useDispatch()

  const getBlockHeight = async (jsonData) => {
    try {
      setCounter((prev) => prev + 1)
      if (jsonData) {
        const network = jsonData && jsonData?.profileSettings[0]?.testnet
        const netWorkType = network ? 'TESTNET' : 'MAINNET'
        if (netWorkType == 'TESTNET') {
          const res = await axios.get(`https://dydx-testnet-rpc.polkachu.com/status?`)
          const data = await res.data
          if (data) {
            // setBlockHeight(data?.result?.sync_info?.latest_block_height)
            const blockHeightFromAPI = data?.result?.sync_info?.latest_block_height
            dispatch(setBlockHeight(blockHeightFromAPI))
          }
        } else {
          const res = await axios.get(`https://indexer.dydx.trade/v4/height`)
          const data = await res.data
          if (data) {
            dispatch(setBlockHeight(data?.height))
          }
        }
      }
    } catch (err) {
      console.log(err)
    }
  }

  // useEffect(() => {
  //   const getData = async () => {
  //     const jsonData = await window.electron.getDBData()
  //     dispatch(setJsonData(jsonData))
  //   }

  //   if (counter % 5) {
  //     getData()
  //   } else if (counter == 0) {
  //     getData()
  //   }
  // }, [counter])

  useEffect(() => {
    const interval = setInterval(() => {
      getBlockHeight(jsonData)
    }, [1500])
    return () => clearInterval(interval)
  }, [jsonData])

  return (
    <>
      <div className="grid grid-cols-12">
        <CryptoMain />
        <Markets />
        <OrdersAndPositions />
      </div>
      <div className="relative">
        <div className="fixed z-50 bottom-3 right-3 rounded-sm border border-white cursor-pointer group">
          <div className="bg-dark p-2">
            <p className="text-md">{blockHeight}</p>
          </div>
          <div className="absolute bottom-10 right-0 hidden group-hover:block bg-gray-800 text-white text-xs w-28 rounded py-1 px-2">
            Block Height
          </div>
        </div>
      </div>
    </>
  )
}

export default TradeMain
