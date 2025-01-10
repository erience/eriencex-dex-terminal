const WebSocket = require('ws')
import { allJson, getCacheData, getJsonData, getMemonic, getNetworkType, saveLog } from './helper'
import getPrice from './trades'

let netWorkType
let memonic
const getUpdatedData = async () => {
  netWorkType = await getNetworkType()
  memonic = await getMemonic()
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
      saveLog('wait for startAcc connect', false)
      setTimeout(checkConnection, 100)
    }
  }

  checkConnection()
}
const startWebSocket = async (pair, size, url) => {
  try {
    console.log('Websocket started')
    saveLog(`startWebSocket connected ${new Date().toISOString()}`)
    // console.log('pair in startWebSocket', pair)
    await getUpdatedData()
    if (netWorkType === 'MAINNET') {
      ws = new WebSocket('wss://indexer.dydx.trade/v4/ws')
    } else if (netWorkType === 'TESTNET') {
      ws = new WebSocket('wss://indexer.v4testnet.dydx.exchange/v4/ws')
    }

    ws.on('open', function open() {
      const subscriptionMessage = JSON.stringify({
        type: 'subscribe',
        channel: 'v4_trades',
        id: pair
      })

      ws.send(subscriptionMessage)
    })

    // ws.on('open', function open() {
    //   console.log('startWebSocket is open')
    //   waitForSocketConnection(ws, () => {
    //     const subscriptionMessage = JSON.stringify({
    //       type: 'subscribe',
    //       channel: 'v4_trades',
    //       id: pair
    //     })
    //     ws.send(subscriptionMessage)
    //     console.log('Subscription message sent')
    //     saveLog('subscription message sent in startWebSocket', false)
    //   })
    // })

    ws.on('message', async function incoming(data) {
      // console.log('Message in subaccount websocket')
      const message = JSON.parse(data)
      await getUpdatedData()
      if (message?.type === "error") {
        console.error('startWebSocket error:', message)
        setTimeout(() => startWebSocket(pair, size, url), 2000)
      }
      if (message.type === 'channel_data' || message.type === 'subscribed') {
        // console.log('inside if', { message })

        let prices = {
          [message.id]: { indexPrice: message.contents.trades[0].price }
        }
        // console.log('Hello', { prices })

        getPrice(prices, size, url)
      }
    })

    ws.on('error', async function error(err) {
      await getUpdatedData()
      console.error('WebSocket error:', err)

      setTimeout(() => startWebSocket(pair, size, url), 2000)
    })

    ws.on('close', async function close() {
      await getUpdatedData()
      console.log('websocket closed ----- trades')
      saveLog(`startWebsocket closed ${new Date().toISOString()}`, false)
      const jsonData = await getCacheData()
      const activeGrid = jsonData?.allGridSettings.some((item) => item.isGridActive)
      if (activeGrid) {
        setTimeout(() => startWebSocket(pair, size, url), 2000)
      }
    })
  } catch (error) {
    console.log(error)
  }
}

export const stopWebSocket = async () => {
  try {
    if (ws) {
      ws.close()
    }
  } catch (error) {
    console.log('Error while stopping websocket', error)
  }
}

export default startWebSocket
