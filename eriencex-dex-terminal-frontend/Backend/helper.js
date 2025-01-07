import fs from 'fs'
import axios from 'axios'
import path from 'path'
import { app } from 'electron'
import crypto from 'crypto'
import winston from 'winston'
const appPath = app.getPath('userData')

const parentDir = path.join(appPath, 'data')
const logsDir = path.join(parentDir, 'logs')
if (!fs.existsSync(parentDir)) {
  fs.mkdir(parentDir, (err) => {
    if (err) {
      console.error('Error creating directory:', err);
    } else {
      console.log('Directory created successfully.');
    }
  });
}
if (!fs.existsSync(logsDir)) {
  fs.mkdir(logsDir, (err) => {
    if (err) {
      console.error('Error creating directory:', err);
    } else {
      console.log('Directory created successfully.');
    }
  });
}
const logFilePath = path.join(logsDir, 'Gridbot.txt')
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: logFilePath })]
})

export const saveLog = async (message, success) => {
  try {
    if (success == false) {
      logger.error(message)
    } else {
      logger.info(message)
    }
  } catch (error) {
    console.log('Error while saving log', error)
  }
}

export const getAssetPrice = async (pair) => {
  try {
    let response
    let netWorkType = await getNetworkType()

    if (netWorkType == 'TESTNET') {
      response = await axios.get(
        `https://indexer.v4testnet.dydx.exchange/v4/candles/perpetualMarkets/${pair}?resolution=1MIN&limit=1`
      )
    } else if (netWorkType == 'MAINNET') {
      response = await axios.get(
        `https://indexer.dydx.trade/v4/candles/perpetualMarkets/${pair}?resolution=1MIN&limit=1`
      )
    }

    const data = response.data
    const price = data?.candles[0]?.close

    return { status: true, price: parseFloat(price) ?? 0 }
  } catch (error) {
    console.error('Error fetching asset price:', error)
    return { status: false, price: 0 }
  }
}

export const generateCustomOrderid = (length, message) => {
  const charset = '0123456789'
  let randomNumberString = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    randomNumberString += charset[randomIndex]
  }

  const str = `4552${randomNumberString}`
  return Number(str)
}

let seconds = 0
export const calculateSecond = (number, timeframe) => {
  switch (timeframe.toLowerCase()) {
    case 'day':
      seconds = number * 24 * 60 * 60
      break
    case 'hour':
      seconds = number * 60 * 60
      break
    case 'minute':
      seconds = number * 60
      break
    case 'second':
      seconds = number
      break
    case 'week':
      seconds = number * 7 * 24 * 60 * 60
      break
    default:
      console.error("Invalid timeframe. Please use 'day', 'hour', 'minute', or 'second'.")
  }

  return seconds
}
export const getOrderLimit = (equity) => {
  if (equity < 20) {
    return 0
  } else if (equity >= 20 && equity < 100) {
    return 4
  } else if (equity >= 100 && equity < 1000) {
    return 8
  } else if (equity >= 1000 && equity < 10000) {
    return 10
  } else if (equity >= 10000 && equity < 100000) {
    return 100
  } else if (equity >= 100000) {
    return 200
  } else {
    return 6
  }
}

export const allJson = {
  dbpath: path.join(appPath, 'data', 'db.json'),
  idPath: path.join(appPath, 'data', 'id.json'),
  errorsPath: path.join(appPath, 'data', 'errors.json'),
  historyPath: path.join(appPath, 'data', 'history.json')
}

// let dbStructure = {
//   Limitorders: [],
//   orders: [],
//   allGridSettings: [],
//   profileSettings: [
//     {
//       memonic: '',
//       userEquity: 0,
//       testnet: false
//     }
//   ]
// }
let dbStructure = null

export const getJsonData = async (filePath) => {
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading file`, error)
    return null
  }
}

export const getCacheData = async () => {
  try {
    // const data = await fs.promises.readFile(filePath, 'utf-8')
    // return JSON.parse(data)
    if (dbStructure) {
      return dbStructure
    } else {
      dbStructure = await getJsonData(allJson.dbpath)
      // console.log('path', allJson.dbpath)
      return dbStructure
    }
  } catch (error) {
    console.error(`Error reading file`, error)
    return null
  }
}

export const saveCacheData = async (data) => {
  dbStructure = data
}

export const saveJsonData = async (filePath, data) => {
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2))
    // dbStructure = data
  } catch (error) {
    console.error(`Error writing to file `, error)
  }
}

export const getNetworkType = async () => {
  const jsonData = await getCacheData()
  const network = jsonData?.profileSettings[0]?.testnet
  return network ? 'TESTNET' : 'MAINNET'
}

export const getMemonic = async () => {
  const jsonData = await getCacheData()
  const memonic = jsonData?.profileSettings[0]?.memonic
  return memonic
}

export const cancelAllOrders = async (openOrders) => {
  try {
    const db = await getCacheData()
    const pastOrders = db.Limitorders
    const limitOrdersOld = pastOrders.filter(
      (x) => x.isOrderOpen == true && x.limitOrderClosed == false
    )
    const marketLimitOrders = db.orders

    // console.log('marketLimitOrders---', marketLimitOrders)

    const findMarketLimitOrders = marketLimitOrders.filter((x) => x.isMarketFilled == false)
    const allOpenOrders = [...limitOrdersOld, ...findMarketLimitOrders]
    // console.log({ allOpenOrders })
    // console.log({ openOrders })
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
    const memonic = db.profileSettings[0]?.memonic
    const netWorkType = db.profileSettings[0]?.testnet
    const server = netWorkType ? 'TESTNET' : 'MAINNET'
    const enMemo = await encryptRSA(memonic)
    allOpenOrders.filter((openOrders) => {
      return openOrders.isOrderOpen || !openOrders.isMarketFilled || !openOrders.isLimitOrderClosed
    })
    for (const element of allOpenOrders) {
      const openOrder = openOrders.filter((order) => {
        return order.clientId === element.systemId
      })
      console.log({ openOrderHello: openOrder })
      if (openOrder.length > 0) {
        const res = await axios.post(`https://tradeapi.dydxboard.com/api/v1/cancelOrder`, {
          clientId: openOrder[0].clientId,
          orderFlags: openOrder[0].orderFlags,
          clobPairId: openOrder[0].ticker,
          goodTilBlock: 0,
          goodTilBlockTime: openOrder[0].goodTilBlockTime,
          memonic: enMemo,
          network: server
        })
      }
    }
    // TODO:
    // await clearJSON()
  } catch (error) {
    console.log('Error while cancelling all orders', error)
  }
}

export const clearJSON = async (gridId) => {
  try {
    console.log("Inside ClearJson", gridId)
    const db = await getCacheData()
    const limitOrders = db.Limitorders;
    let newLimitOrders = []
    if (limitOrders.length > 0) {
      newLimitOrders = limitOrders.filter((order) => {
        return order.gridSettingid != gridId
      })
    }
    const orders = db.orders;
    let newOrders = []

    if (orders.length > 0) {
      newOrders = orders.filter((order) => {
        return order.gridSettingid != gridId
      })
    }
    db.Limitorders = newLimitOrders
    db.orders = newOrders
    await saveCacheData(db)
  } catch (err) {
    console.log('Error clearing JSON files:', err)
  }
}

export const printLog = (message) => {
  try {
    saveLog(message, false)
  } catch (error) {
    console.log('print error:', error)
  }
}
