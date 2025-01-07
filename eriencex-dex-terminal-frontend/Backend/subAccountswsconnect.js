import dotenv from 'dotenv'
dotenv.config()
const WebSocket = require('ws')
import axios from 'axios'
import crypto from 'crypto'

import {
  allJson,
  generateCustomOrderid,
  getCacheData,
  getJsonData,
  getMemonic,
  getNetworkType,
  saveCacheData,
  saveJsonData,
  saveLog
} from './helper'

let netWorkType
let memonic

const getUpdatedData = async () => {
  netWorkType = await getNetworkType()
  memonic = await getMemonic()
}

async function encryptRSA(message) {
  const publicKey = import.meta.env.VITE_PUBLIC_KEY
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(message)
  )
  return encrypted.toString('base64')
}

let ws
// Wait for WebSocket to connect
function waitForSocketConnection(socket, callback) {
  const checkConnection = () => {
    if (socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket connection established')
      callback()
    } else {
      console.log('Waiting for WebSocket connection...')
      saveLog('wait for subacc connect', false)
      setTimeout(checkConnection, 100)
    }
  }

  checkConnection()
}

const startWebSocketSubAccount = async (address, size, url, grid) => {
  try {
    saveLog(`Sub Account Connected ${new Date().toISOString()}`)
    console.log('Sub Account Connected')
    const parsedSize = parseFloat(size)
    await getUpdatedData()
    const enMemo = await encryptRSA(memonic)
    const profitPercentage = grid?.profitPercentage

    if (netWorkType == 'MAINNET') {
      ws = new WebSocket('wss://indexer.dydx.trade/v4/ws')
    } else if (netWorkType == 'TESTNET') {
      ws = new WebSocket('wss://indexer.v4testnet.dydx.exchange/v4/ws')
    }

    ws.on('open', function open() {
      const subscriptionMessage = JSON.stringify({
        type: 'subscribe',
        channel: 'v4_subaccounts',
        id: `${address}/0`
      })

      ws.send(subscriptionMessage)
    })

    // ws.on('open', function open() {
    //   console.log('sub acc WebSocket is open')
    //   waitForSocketConnection(ws, () => {
    //     const subscriptionMessage = JSON.stringify({
    //       type: 'subscribe',
    //       channel: 'v4_subaccounts',
    //       id: `${address}/0`
    //     })

    //     // Send subscription message after connection is open
    //     ws.send(subscriptionMessage)
    //     console.log('Subscription message sent')
    //     saveLog('Subscription message sent in sub account', false)
    //   })
    // })

    ws.on('message', async function incoming(data) {
      await getUpdatedData()
      let message
      try {
        message = JSON.parse(data)
        // const Historydb = await getJsonData(allJson.historyPath)
        // const history = Historydb?.history
        // history.push(message)
        // await saveCacheData(allJson.historyPath, Historydb)
      } catch (error) {
        console.log({ error })
      }
      if (message.type === 'subscribed') {
        let db = await getCacheData()
        const Limitorders = db.Limitorders
        const ordersinDb = db.orders

        const openOrders = message?.contents?.orders
        const subAccInfo = message?.contents?.subaccount
        const freeCollateral = subAccInfo?.freeCollateral
        db.profileSettings[0].userEquity = Number(freeCollateral)
        if (openOrders && openOrders.length > 0) {
          const openOrdersClientIds = openOrders.map((order) => {
            return order.clientId
          })
          // console.log('openOrdersClientIds', openOrdersClientIds)

          // db.Limitorders = Limitorders.filter((order) => {
          //   return openOrdersClientIds.includes(order.systemId)
          // })
          // db.orders = ordersinDb.filter((order) => {
          //   return openOrdersClientIds.includes(order.systemId)
          // })
          // db.Limitorders = []
          // db.orders = []
          // console.log('db.Limitorders', db.Limitorders)
          // console.log('db.orders', db.orders)
        } else {
          // db.Limitorders = []
          // db.orders = []
          // console.log('db.Limitorders', db.Limitorders)
          // console.log('db.orders', db.orders)
        }
        // db.orders = ordersinDb.filter((order) => {
        //   return !order.limitOrderClosed
        // })
        await saveCacheData(db)
      }
      if (message.type == 'channel_data') {
        // console.log("Message in subaccount websocket")
        // console.log('Channel data in startWebscoketAccount')
        if (message?.contents?.orders && message?.contents?.orders[0]) {
          // console.log('Order', message.contents.orders[0])
          // console.log('Fills', message.contents?.fills[0])
          const clientId = message.contents.orders[0].clientId
          const pair = message.contents.orders[0].ticker
          let price = message.contents?.orders?.[0]?.price
          // const price = message.contents?.fills[0]?.price || message.contents?.orders[0]?.price
          if (message.contents?.fills?.[0]?.price) {
            // console.log('In If Fills', message.contents?.fills[0])
            price = message.contents?.fills[0]?.price
          }
          const sellPriceWithProfit =
            Number(price) + (Number(price) * Number(profitPercentage)) / 100
          // console.log({
          //   sellPriceWithProfit,
          //   price,
          //   profitPercentage,
          //   sellPriceWithProfitType: typeof sellPriceWithProfit,
          //   priceType: typeof price,
          //   profitPercentageType: typeof profitPercentage
          // })

          const status = message.contents.orders[0].status
          const side = message.contents.orders[0].side

          if (status == 'FILLED' && side == 'BUY') {
            const fee = message.contents?.fills?.[0]?.fee
            const liquidityType = message.contents?.fills?.[0]?.liquidity
            saveLog(`Buy Order Filled order.systemId: ${clientId}`)
            const db = await getCacheData()
            const oldOrders = db.orders

            const openOrders = oldOrders.filter(
              (x) => x.systemId == clientId && x.isMarketFilled == false
            )

            // console.log('open orders -------', openOrders)
            if (openOrders?.length > 0) {
              for (const order of oldOrders) {
                if (order.systemId == clientId) {
                  const pastOrders = db.Limitorders
                  const limitOrdersOld = pastOrders.filter(
                    (x) => x.isOrderOpen == true && x.limitOrderClosed == false
                  )
                  // default value to average price if not going inside if(limitOrdersOld.length > 2)
                  let averagePrice = Number(price)
                  // Adding Price of Current Order into calculation
                  let totalPriceOfAllOpenOrders = Number(price)
                  if (limitOrdersOld.length >= 2) {
                    for (const order of limitOrdersOld) {
                      // Adding Price of Old Orders into calculation
                      totalPriceOfAllOpenOrders += Number(order.priceBoughtOn)
                    }
                    // console.log({ totalPriceOfAllOpenOrders })
                    averagePrice = totalPriceOfAllOpenOrders / (limitOrdersOld.length + 1)
                  }
                  const avgSellPriceWithProfit =
                    averagePrice + (averagePrice * Number(profitPercentage)) / 100
                  order.isMarketFilled = true
                  order.fee = fee
                  order.liquidityType = liquidityType

                  const limitOrderId = generateCustomOrderid(5, 'Limit Order SubAccount')

                  let generateLimitOrderData = {
                    systemId: `${limitOrderId}`,
                    limitOrderAgainOrderId: `${clientId}`,
                    pair: pair,
                    size,
                    priceBoughtOn: price,
                    triggerPrice: sellPriceWithProfit,
                    isOrderOpen: true,
                    gridSettingid: order.gridSettingid,
                    finalOrderOpen: false,
                    limitOrderClosed: false
                  }

                  // console.log('generateLimitOrderData -------', generateLimitOrderData)



                  setTimeout(async () => {
                    let passData = {
                      pair: pair,
                      size: parsedSize,
                      side: 'sell',
                      triggerPrice: sellPriceWithProfit,
                      oType: 'LIMIT',
                      price: sellPriceWithProfit,
                      memonic: enMemo,
                      ordertype: 'GTT',
                      time: 1,
                      timeFrame: 'day',
                      reduceOnly: false,
                      postOnly: false,
                      network: netWorkType,
                      orderid: generateLimitOrderData.systemId
                    }

                    // console.log('pass data in subAcc', passData)
                    try {
                      let generateAvgLimitOrderData = null
                      if (limitOrdersOld.length >= 2) {
                        const limitOrderId = generateCustomOrderid(5, 'Limit Order SubAccount')
                        const orderIds = []
                        limitOrdersOld.map((order) => {
                          if (order.isMergeOrder === true && order.isMergeOrderOpen === true) {
                            db.Limitorders.forEach((data) => {
                              if (data.systemId === order.systemId) {
                                data.isMergeOrderOpen = false
                              }
                            })
                            orderIds.push(...order.orderIds)
                          }
                          if (!order.isMergeOrder || !order.isMergeOrderOpen) {
                            orderIds.push(order.systemId);
                          }
                        })
                        try {
                          await axios.post(`${url}api/v1/cancelGridOrder`, { orderIds, memonic: enMemo, network: netWorkType })
                        } catch (error) {
                          console.log("Error while canceling Order", error)
                        }

                        generateAvgLimitOrderData = {
                          isMergeOrder: true,
                          isMergeOrderOpen: true,
                          systemId: `${limitOrderId}`,
                          orderIds,
                          pair: pair,
                          avgSellPriceWithProfit,
                          averagePrice,
                          isOrderOpen: true,
                          gridSettingid: order.gridSettingid,
                          finalOrderOpen: false,
                          limitOrderClosed: false
                        }
                      }
                      await axios.post(`${url}api/v1/limitorder`, passData)
                      db.Limitorders.push(generateLimitOrderData)
                      if (generateAvgLimitOrderData) {
                        db.Limitorders.push(generateAvgLimitOrderData)
                      }
                      db.orders = oldOrders
                      await saveCacheData(db)
                    } catch (error) {
                      console.log(error)
                    }
                  }, 1000)
                }
              }
            }
          } else if (status == 'FILLED' && side == 'SELL') {
            saveLog(`Sell Order Filled order.systemId: ${clientId}`)
            const fee = message.contents?.fills?.[0]?.fee
            const liquidityType = message.contents?.fills?.[0]?.liquidity
            const db = await getCacheData()
            const oldOrders = db.orders
            const oldLimitOrders = db.Limitorders
            let feesPerOrder = fee
            let openLimitOrders = oldLimitOrders.filter(
              (x) => x.systemId == clientId && x.isOrderOpen == true
            )
            if (openLimitOrders[0].isMergeOrder && openLimitOrders[0].isMergeOrder === true) {
              const mergeOrder = openLimitOrders[0]
              feesPerOrder = feesPerOrder / mergeOrder.orderIds.length
              const ordersInMergeOrder = oldLimitOrders.filter((order) => {
                return mergeOrder.orderIds.includes(order.systemId)
              })
              oldLimitOrders.forEach((order) => {
                if (order.systemId === clientId) {
                  order.isMergeOrderOpen = false
                  order.isOrderOpen = false
                  order.limitOrderClosed = true
                }
              })
              openLimitOrders = ordersInMergeOrder
            }

            if (openLimitOrders.length > 0) {
              for (const order of oldOrders) {
                for (const limitOrder of openLimitOrders) {
                  if (limitOrder.limitOrderAgainOrderId == order.systemId) {
                    if (limitOrder.systemId == clientId) {
                      order.isOrderOpen = false
                      order.limitOrderClosed = true
                      // order.fee = fee
                      // order.liquidityType = liquidityType
                    }
                  }
                }
              }

              for (const limitOrder of oldLimitOrders) {
                if (limitOrder.systemId == clientId) {
                  limitOrder.isOrderOpen = false
                  limitOrder.limitOrderClosed = true
                  limitOrder.fee = feesPerOrder
                  limitOrder.liquidityType = liquidityType
                }
              }

              db.orders = oldOrders
              db.Limitorders = oldLimitOrders

              await saveCacheData(db)
            }
          } else if (status == 'BEST_EFFORT_CANCELED' || status == 'CANCELED') {
            const db = await getCacheData()
            const oldOrders = db.orders
            saveLog(`Cancelled Order order.systemId: ${clientId}`)

            const openOrders = oldOrders.filter(
              (x) => x.systemId == clientId && x.isMarketFilled == false
            )

            if (openOrders.length > 0) {
              for (const order of oldOrders) {
                if (order.systemId == clientId) {
                  order.isMarketFilled = false
                  order.isOrderOpen = false
                  order.isthisbuylimitOrder = false
                }
              }

              db.orders = oldOrders
              await saveCacheData(db)
            }
          }
        }
      }
    })

    ws.on('error', function error(err) {
      console.error('WebSocket error:', err)
      setTimeout(startWebSocketSubAccount, 2000)
    })

    ws.on('close', async function close() {
      console.log('Sub Account Disconnected')
      saveLog(`Sub Account Disconnected ${new Date().toISOString()}`, false)
      const jsonData = await getCacheData()
      const activeGrid = jsonData.allGridSettings.some((item) => item.isGridActive)
      if (activeGrid) {
        setTimeout(startWebSocketSubAccount, 2000)
      }
    })
  } catch (error) {
    console.log(error)
  }
}

export const closeWebSocketSubAccount = async () => {
  try {
    if (ws) {
      ws.close()
    }
  } catch (error) {
    console.log('Error closing WebSocket', error)
  }
}

export default startWebSocketSubAccount
