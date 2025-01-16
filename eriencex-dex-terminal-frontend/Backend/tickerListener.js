const WebSocket = require('ws')
import { allJson, getCacheData, getJsonData, getMemonic, getNetworkType, saveLog } from './helper'
import getPrice from './trades'

let netWorkType
let memonic
const getUpdatedData = async () => {
  netWorkType = await getNetworkType()
  memonic = await getMemonic()
}

class OrderBook {
  constructor() {
    this.bids = new Map();
    this.asks = new Map();
    this.highestBid = null;
    this.lowestAsk = null;
  }

  updateOrderMap(orderMap, updates, offset) {
    updates.forEach(({ price, size }) => {
      if (size === 0) {
        orderMap.delete(price); // Remove entries with size 0
      } else {
        orderMap.set(price, { size, offset }); // Update size and offset
      }
    });
  }

  mapToSortedArray(orderMap, ascending = true) {
    return Array.from(orderMap.entries())
      .map(([price, { size, offset }]) => ({ price: parseFloat(price), size, offset }))
      .sort((a, b) => (ascending ? a.price - b.price : b.price - a.price));
  }

  update(data) {
    if (data.contents) {
      const offset = data.message_id; // Use message_id as the offset

      if (data.contents.asks) {
        const updates = data.contents.asks.map(([price, size]) => ({
          price: parseFloat(price),
          size: parseFloat(size),
        }));
        this.updateOrderMap(this.asks, updates, offset);
      }

      if (data.contents.bids) {
        const updates = data.contents.bids.map(([price, size]) => ({
          price: parseFloat(price),
          size: parseFloat(size),
        }));
        this.updateOrderMap(this.bids, updates, offset);
      }

      this.updateBestPrices();
    }
  }

  updateBestPrices() {
    const bidPrices = Array.from(this.bids.keys());
    const askPrices = Array.from(this.asks.keys());

    this.highestBid = bidPrices.length > 0 ? Math.max(...bidPrices) : null;
    this.lowestAsk = askPrices.length > 0 ? Math.min(...askPrices) : null;
  }

  uncrossOrderBook() {
    const bidArray = this.mapToSortedArray(this.bids, false); // Descending
    const askArray = this.mapToSortedArray(this.asks, true);  // Ascending

    while (
      bidArray.length > 0 &&
      askArray.length > 0 &&
      bidArray[0].price >= askArray[0].price
    ) {
      const highestBid = bidArray[0];
      const lowestAsk = askArray[0];

      if (highestBid.offset < lowestAsk.offset) {
        bidArray.shift();
      } else if (highestBid.offset > lowestAsk.offset) {
        askArray.shift();
      } else {
        if (highestBid.size > lowestAsk.size) {
          askArray.shift();
          bidArray[0].size -= lowestAsk.size;
        } else if (highestBid.size < lowestAsk.size) {
          bidArray.shift();
          askArray[0].size -= highestBid.size;
        } else {
          bidArray.shift();
          askArray.shift();
        }
      }
    }

    this.bids = new Map(bidArray.map(({ price, size, offset }) => [price, { size, offset }]));
    this.asks = new Map(askArray.map(({ price, size, offset }) => [price, { size, offset }]));
    this.updateBestPrices();
  }

  cleanUpOrderBook() {
    // Clean up entries outside the spread to save memory
    this.bids = new Map(
      Array.from(this.bids.entries()).filter(([price]) => this.lowestAsk === null || price < this.lowestAsk)
    );
    this.asks = new Map(
      Array.from(this.asks.entries()).filter(([price]) => this.highestBid === null || price > this.highestBid)
    );
    this.updateBestPrices();
  }

  displayOrderBook() {
    const averagePrice = this.highestBid !== null && this.lowestAsk !== null
      ? ((this.highestBid + this.lowestAsk) / 2)
      : 'N/A';
    console.log('\n=== Merged Order Book ===');
    console.log('Asks (Sell Orders):');
    console.table(this.mapToSortedArray(this.asks, true).slice(0, 10).reverse());
    console.log('Average Price:', averagePrice);
    console.log('Bids (Buy Orders):');
    console.table(this.mapToSortedArray(this.bids, false).slice(0, 10));
  }
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
let lastDisplayTime = 0;
const displayInterval = 1000;
let lastSentPrice = null;

const throttledSendPrice = (orderbook, size, url, pair) => {
  const now = Date.now();
  const currentPrice = orderbook.highestBid;

  if (now - lastDisplayTime >= displayInterval) {
    if (currentPrice !== lastSentPrice) {
      let prices = {
        [pair]: { indexPrice: currentPrice }
      };

      getPrice(prices, size, url);
      lastSentPrice = currentPrice;

      console.log('Sending new price:', currentPrice);
    }

    lastDisplayTime = now;
  }
};

const startWebSocket = async (pair, size, url) => {
  try {
    const orderBook = new OrderBook();
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
        channel: 'v4_orderbook',
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

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'subscribed') {
          const { bids, asks } = data.contents;
          const bidUpdates = bids.map((bid) => ({
            price: parseFloat(bid.price),
            size: parseFloat(bid.size),
          }));
          const askUpdates = asks.map((ask) => ({
            price: parseFloat(ask.price),
            size: parseFloat(ask.size),
          }));
          orderBook.updateOrderMap(orderBook.bids, bidUpdates, data.message_id);
          orderBook.updateOrderMap(orderBook.asks, askUpdates, data.message_id);
          orderBook.updateBestPrices();
          // orderBook.displayOrderBook();
          throttledSendPrice(orderBook, size, url, pair);
        } else if (data.type === 'channel_data') {
          orderBook.update(data);
          orderBook.uncrossOrderBook();
          throttledSendPrice(orderBook, size, url, pair);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error.message);
      }
      // console.log('Message in subaccount websocket')
      // const message = JSON.parse(data)
      // await getUpdatedData()
      // if (message.type === 'channel_data' || message.type === 'subscribed') {
      //   // console.log('inside if', { message })

      //   let prices = {
      //     [message.id]: { indexPrice: message.contents.trades[0].price }
      //   }
      //   // console.log('Hello', { prices })

      //   getPrice(prices, size, url)
      // }
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
