import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import OpenOrders from './OpenOrders'
import Positions from './Positions'
import axios from 'axios'
import OrderHistory from './OrderHistory'
import GridBotInfo from './GridBotInfo'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectData,
  setFreeCollateral,
  setOpenOrderData,
  setUserEquity
} from '../redux-toolkit/dataSlice'
import CopybotLogs from './CopybotLogs'

const OrdersAndPositions = () => {
  const [activeTab, setActiveTab] = useState('openorder')
  const { webSocketURL, chainAddress, API, server } = useSelector(selectData)
  const openOrders = useSelector((state) => state.data.openOrderData)

  const [positionData, setPositionData] = useState([])
  const [subAccNo, setSubAccNo] = useState(null)
  const [orderHistory, setOrderHistory] = useState([])
  const [ordersCount, setOrdersCount] = useState(0)
  const dispatch = useDispatch()
  let x = true
  const orderRef = useRef([])
  const reconnectTimeout = useRef(null)
  const chainAdddressRef = useRef('')
  const PrintLogs = async (message) => {
    await window.electron.printlogs(message)
  }

  const tabs = [
    // { id: 'openorder', label: 'Open Orders', count: openOrders.length },
    { id: 'openorder', label: 'Open Orders', count: ordersCount },
    {
      id: 'position',
      label: 'Positions',
      count: positionData.length > 0 ? positionData.length : 0
    },
    { id: 'orderhistory', label: 'Order History' },
    { id: 'gridbot', label: 'GridBot' },
    { id: 'copybot', label: 'Copybot' }
  ]

  const setUserEquityToJSON = async (equity) => {
    try {
      await window.electron.addEquity(equity)
    } catch (error) {
      console.log('Error while setting userEquity to JSON', error)
    }
  }

  const getSubAccountNo = async () => {
    try {
      if (chainAdddressRef.current != '') {
        // console.log('getSubAccount called')
        const res = await axios.get(`${API}/addresses/${chainAdddressRef.current}`)
        const data = res.data
        // console.log('sub acc no.', data?.subaccounts[0].subaccountNumber)
        setSubAccNo(data?.subaccounts[0].subaccountNumber)
      } else {
        setSubAccNo(null)
        orderRef.current = []
        setPositionData([])
        setOrderHistory([])
        dispatch(setFreeCollateral(0))
      }
    } catch (err) {
      console.log(err)
      setSubAccNo(null)
      orderRef.current = []
      setPositionData([])
      setOrderHistory([])
    }
  }

  const getCollateralValue = async () => {
    try {
      if (chainAdddressRef.current != '') {
        const res = await axios.get(`${API}/addresses/${chainAdddressRef.current}/subaccountNumber/${subAccNo}`)
        const data = res.data
        const updatedCollateral = data?.subaccount?.freeCollateral
        dispatch(setFreeCollateral(parseFloat(updatedCollateral)))
        // await setUserEquityToJSON(parseFloat(updatedCollateral))
      }
    } catch (err) {
      console.log('error getting collateral value', err)
    }
  }

  const connectWebSocket = useCallback(() => {
    // console.log("chain Address in connect websocket", { chainAddress: chainAdddressRef.current, subAccNo })
    if (chainAdddressRef.current != '') {
      try {
        const webSocket = new WebSocket(webSocketURL)
        console.log("websocket");

        if (reconnectTimeout.current) {
          console.log("websocket reconnected");
          clearTimeout(reconnectTimeout.current)
          reconnectTimeout.current = null
        }

        webSocket.onopen = function (event) {
          PrintLogs('orders & position ws connected')
          // orderRef.current = []
          // setPositionData([])
          // setOrderHistory([])
        }

        webSocket.onmessage = function (event) {
          const responseData = JSON.parse(event.data)
          if (x) {
            x = false
            const params = {
              type: 'subscribe',
              channel: 'v4_subaccounts',
              id: `${chainAdddressRef.current}/${subAccNo}`,
              connection_id: responseData.connection_id
            }
            webSocket.send(JSON.stringify(params))
          } else {
            // ---------------------------- GET ORDERS ----------------------------
            PrintLogs(`Message Received in orders & websocket ${responseData}`)

            if (responseData?.contents?.orders) {
              const newOrders = responseData?.contents?.orders || []
              console.log('newOrders:', newOrders)

              const openOrders = newOrders.filter(
                (order) => order.status === 'OPEN' || order.status === 'BEST_EFFORT_OPENED'
              )

              // let prevOrders = orderRef.current
              const filledOrderIds = newOrders
                .filter(
                  (order) =>
                    order.status != 'OPEN' &&
                    order.status != 'UNTRIGGERED' &&
                    order.status != 'BEST_EFFORT_OPENED'
                )
                .map((order) => order.id)
              let prevOrders = orderRef.current.map((order) => {
                if (filledOrderIds.includes(order.id)) {
                  return {
                    ...order,
                    timestamp: Date.now() + 2 * 1000
                  }
                }
                return order
              })

              // -------------------- REMOVE EXPIRED ORDERS ----------------------
              const finalOrder = [...openOrders, ...prevOrders]
              orderRef.current = finalOrder
            }

            // ------------------------------ GET POSITIONS ------------------------------
            if (responseData?.contents?.subaccount?.openPerpetualPositions) {
              setPositionData((prev) => [
                ...prev,
                ...Object.values(responseData?.contents?.subaccount?.openPerpetualPositions)
              ])
            }

            // ---------------------------- POSITION UPDATE ----------------------------
            if (responseData?.contents?.perpetualPositions) {
              const newPositions = responseData?.contents?.perpetualPositions || []
              const positionsUpdate = responseData?.contents?.perpetualPositions?.filter((item) => {
                const keys = Object.keys(item)
                return (
                  keys.includes('realizedPnl') &&
                  keys.includes('unrealizedPnl') &&
                  item.status !== 'CLOSED'
                )
              })

              if (positionsUpdate.length > 0) {
                setPositionData((prevPositions) => {
                  const updatedPositions = prevPositions.filter((prevItem) => {
                    return !positionsUpdate.find((newItem) => newItem.market === prevItem.market)
                  })
                  return [...updatedPositions, ...positionsUpdate]
                })
                // PrintLogs('positionsUpdated in if')
              } else {
                setPositionData((prevPositions) => {
                  const updatedPositions = prevPositions.filter((prevItem) => {
                    return !newPositions.find((newItem) => newItem.market === prevItem.market)
                  })
                  return updatedPositions
                })
                // PrintLogs('positionsUpdated in else')
              }
            }

            // -------------------------- GET EQUITY --------------------------
            if (responseData?.contents?.subaccount?.equity) {
              const accEquity = responseData?.contents?.subaccount?.equity
              dispatch(setUserEquity(parseFloat(accEquity)))
            }

            // -------------------------- GET FREE COLLATERAL --------------------------
            if (responseData?.contents?.subaccount?.freeCollateral) {
              const avlb = responseData?.contents?.subaccount?.freeCollateral
              dispatch(setFreeCollateral(parseFloat(avlb)))
              setUserEquityToJSON(parseFloat(avlb))
            }

            // -------------------------- GET ORDER FILLS --------------------------
            if (responseData?.contents?.fills) {
              const newOrders = responseData?.contents?.fills || []
              setOrderHistory((prevOrders) => [...newOrders, ...prevOrders])
              setTimeout(() => {
                getCollateralValue()
              }, 2000)
            }
          }
        }

        webSocket.onerror = function (event) {
          x = true
          console.error('WebSocket encountered error:', event)
          console.log('WebSocket connection closed.', event)
          PrintLogs('orders & position ws closed')
          if (!reconnectTimeout.current) {
            reconnectTimeout.current = setTimeout(connectWebSocket, 1500)
          }
        }

        webSocket.onclose = function (event) {
          x = true
          console.log('WebSocket connection closed.', event)
          PrintLogs('orders & position ws closed')
          if (!reconnectTimeout.current) {
            reconnectTimeout.current = setTimeout(connectWebSocket, 1500)
          }
        }

        return () => {
          webSocket.close()
          if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current)
            reconnectTimeout.current = null
          }
        }
      } catch (error) {
        console.error('Error during WebSocket connection setup or handling:', error)
      }
    } else {
      setSubAccNo(null)
      orderRef.current = []
      setPositionData([])
      setOrderHistory([])
    }
  }, [webSocketURL, chainAdddressRef.current, subAccNo])

  const memoizedConnectWebSocket = useMemo(() => connectWebSocket, [connectWebSocket])

  useEffect(() => {
    if (subAccNo != null) {
      // console.log('inside useeffect')
      const cleanupWebSocket = memoizedConnectWebSocket()
      return cleanupWebSocket
    }
  }, [subAccNo, memoizedConnectWebSocket])

  useEffect(() => {
    chainAdddressRef.current = chainAddress
    getSubAccountNo()
  }, [API, chainAddress, server])

  const changeTab = (tabName) => {
    setActiveTab(tabName)
  }

  useEffect(() => {
    if (orderRef.current) {
      const orders = orderRef.current
      dispatch(setOpenOrderData(orders))
    }

    const interval = setInterval(() => {
      const order = orderRef.current
      const now = Date.now()
      orderRef.current = order?.filter((order) => !order?.timestamp || order.timestamp > now)
    }, 500)
    return () => {
      clearInterval(interval)
    }
  }, [orderRef.current])

  useEffect(() => {
    // console.log("openOrders.length",openOrders.length)

    // if (openOrders.length > 0) {
    // console.log('open orders', openOrders)
    const latestOpenOrders = openOrders.filter((order) => order.status != 'FILLED')
    // console.log("latestOpenOrders.length",latestOpenOrders.length,openOrders)
    setOrdersCount(latestOpenOrders.length)
    // }
  }, [openOrders])

  return (
    <>
      <div className="relative col-span-12 xxl:col-span-12 border-t border-gray-700">
        <div className="relative py-5 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`py-1.5 px-2 !text-xs font-semibold ${activeTab === tab.id ? 'primary-color' : 'text-gray-400'
                    }`}
                  onClick={() => changeTab(tab.id)}
                >
                  {tab.label}
                  {tab.count >= 0 && `(${tab.count})`}
                </button>
              ))}
            </div>
          </div>

          {activeTab == 'openorder' && <OpenOrders />}
          {activeTab == 'position' && <Positions positionData={positionData} />}
          {activeTab == 'orderhistory' && (
            <OrderHistory orderHistory={orderHistory} setOrderHistory={setOrderHistory} />
          )}
          {activeTab == 'gridbot' && <GridBotInfo subAccNo={subAccNo} />}
          {activeTab == 'copybot' && <CopybotLogs />}
        </div>
      </div>
    </>
  )
}

export default OrdersAndPositions
