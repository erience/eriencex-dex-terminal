import axios from `axios`
import {
  allJson,
  generateCustomOrderid,
  getCacheData,
  getJsonData,
  getMemonic,
  getNetworkType,
  getOrderLimit,
  saveCacheData,
  saveJsonData,
  saveLog
} from './helper'
import crypto from 'crypto'


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
      oaepHash: "sha256"
    },
    Buffer.from(message)
  );
  return encrypted.toString('base64');
}

const calculateGrid = (from, to, gridRange) => {
  const gridRanges = []
  for (let i = Number(from); i <= Number(to); i += gridRange) {
    // @ts-ignore
    gridRanges.push(i)
  }
  // console.log('gridRanges in calculate',gridRanges)
  return gridRanges
}

let isTradeHappening = false

// Execute down level 3 orders
const executeOtherOrders = async (
  orderArray,
  pair,
  profitPercentageC,
  gridSettingid,
  marginToc,
  size,
  gridindex,
  url,
) => {
  try {
    console.log("-------------------In Execute Other Order-----------------------", {
      orderArray,
      pair,
      profitPercentageC,
      gridSettingid,
      marginToc,
      size,
      gridindex,
      url
    })
    // saveLog('execute order called')
    if (orderArray.includes(undefined)) {
      isTradeHappening = false
      saveLog('execute order return cause of undefined', false)
      return
    }
    await getUpdatedData()
    const enMemo = await encryptRSA(memonic)
    for (let i = 0; i < orderArray.length; i++) {
      let isOrderOpen = false
      const margintoConsider = marginToc
      const price = Number(orderArray[i])
      const margin = price + margintoConsider
      const profitCalculate = price + (price * Number(profitPercentageC)) / 100

      const db = await getCacheData()
      const pastOrders = db.orders
      const filterActiveOrders = pastOrders.filter(
        (x) =>
          x.gridSettingid == gridSettingid &&
          x.isOrderOpen == true &&
          x.gridindex == gridindex - (i + 3)
      )
      if (filterActiveOrders.length == 0) {
        const orderId = generateCustomOrderid(5, 'Line number 199 trades.ts')
        // console.log("======================= In Execute Other Order Place Order =================== ")

        let generateOrderData = {
          systemId: `${orderId}`,
          pair: pair,
          size,
          priceBoughtOn: price,
          triggerPrice: profitCalculate,
          isOrderOpen: true,
          gridSettingid: gridSettingid,
          isMarketFilled: false,
          limitOrderClosed: false,
          finalOrderOpen: false,
          isthisbuylimitOrder: true,
          gridindex: gridindex - (i + 3)
        }
        db.orders.push(generateOrderData)
        await saveCacheData(db)
        console.log("GridIndex-1", gridindex - (i + 3))


        setTimeout(async () => {
          let passData = {
            "pair": pair,
            "size": size,
            "side": "buy",
            "triggerPrice": price,
            "oType": "LIMIT",
            "price": price,
            "memonic": enMemo,
            "ordertype": "GTT",
            "time": 1,
            "timeFrame": "minute",
            "reduceOnly": false,
            "postOnly": false,
            "network": netWorkType,
            orderid: `${generateOrderData.systemId}`
          }
          // console.log('pass data in In Execute Other Order', passData) 
          try {
            const limitorder = await axios.post(`${url}api/v1/limitorder`, passData);

          } catch (error) {
            db.orders.filter((order) => {
              return order.systemId != generateOrderData.systemId
            })
            await saveCacheData(db)
            console.log("Error while placing order in executeOtherOrder", error)
          }
          saveLog(`Buy Order Placed In Execute Other Order systemId: ${orderId}`)
        }, 500)
      } else {
      }
    }

    isTradeHappening = false
  } catch (error) {
    console.log({ error: error })
  }
}

function calculatePriceHike(currentPrice) {
  let percentage = 1;
  const hikeAmount = currentPrice * (percentage / 100);
  const newPrice = currentPrice + hikeAmount;
  return newPrice;
}

const getPrice = async (prices, size, url) => {
  try {
    console.log('getPrice called')
    // saveLog(`get price called ${Date.now()}`);
    const parsedSize = parseFloat(size)
    // console.log('parsedSize',parsedSize)
    if (isTradeHappening == false) {
      const db = await getCacheData()
      await getUpdatedData()
      const enMemo = await encryptRSA(memonic)

      const gridSettings = db.allGridSettings
      const equity = db.profileSettings[0].userEquity
      // console.log('gridSettings in getprice', gridSettings)

      if (gridSettings.length > 0) {
        const findActiveGrid = gridSettings.filter((x) => x.isGridActive == true)

        if (findActiveGrid && findActiveGrid.length > 0) {
          // console.log('findActiveGrid ------ in ', findActiveGrid)
          for (const range of findActiveGrid) {
            const pair = range.pair
            const from = range.from
            const to = range.to
            const gridSettingid = range.gridId
            const totalGrid = range.totalGrid
            const dollarstoInvest = range.dollars
            const profitPercentageC = range.profitPercentage
            const margintoConsider = range.slippage

            const gridRange = (to - from) / totalGrid
            const gridRanges = calculateGrid(from, to, gridRange)
            // console.log('from in getprice ---',from)
            // console.log('to in getprice ---',to)
            // console.log('gridRange in getprice ---',gridRange)
            // console.log('pair in getprice ---',pair)
            // console.log('gridranges --------', gridRanges)

            if (prices[pair]) {
              if (prices[pair]?.indexPrice && prices[pair].indexPrice != undefined) {
                const price = Number(prices[pair]?.indexPrice)
                // console.log('prices of pair---',prices[pair])

                // console.log('price in getprice -----',price)

                const profitCalculate = price + (price * Number(profitPercentageC)) / 100

                // console.log('profitCalculate in getprice -----',profitCalculate)

                for (let i = 0; i < gridRanges.length; i++) {
                  const marginFrom = Number(gridRanges[i]) - ((Number(gridRanges[i]) * Number(margintoConsider)) / 100)
                  const marginTo = Number(gridRanges[i]) + ((Number(gridRanges[i]) * Number(margintoConsider)) / 100)
                  // console.log("margin in for loop----",{marginFrom,marginTo})
                  // console.log("gridRanges[i] in for loop----",gridRanges[i])
                  // console.log({condition2: Number(price) >= marginFrom, condition3:Number(price) <= marginTo})
                  if (Number(price) >= marginFrom && Number(price) <= marginTo) {
                    console.log('Price matched')
                    saveLog(`Price matched ${marginFrom} - ${price} -${marginTo}`)
                    const pastOrders = db.orders
                    const filterActiveOrders = pastOrders.filter(
                      (x) =>
                        x.gridSettingid == gridSettingid &&
                        x.isOrderOpen == true &&
                        x.gridindex == i
                    )
                    let marketOrderToPlace = false
                    // const filterActiveOrdersToPlaceMarketOrder = pastOrders.filter(
                    //   (x) =>
                    //     x.gridSettingid == gridSettingid &&
                    //     x.isOrderOpen == true
                    // )
                    // console.log("filterActiveOrdersToPlaceMarketOrder",{filterActiveOrdersToPlaceMarketOrder})
                    // console.log('filterActive-----',filterActiveOrders)
                    if (pastOrders.length === 0) {
                      marketOrderToPlace = true;
                    }

                    let isOrderOpen = false
                    if (filterActiveOrders.length == 0 && price != null) {
                      const gridToBeAdded = []

                      if (!isTradeHappening) {
                        isTradeHappening = true

                        let currentIndex1 = i - 1
                        let currentIndex = Math.abs(currentIndex1)



                        if (currentIndex <= 0) {
                        } else if (currentIndex >= 1) {
                          let indexer = 2


                          for (let j = 0; j < currentIndex; j++) {
                            if (j == 1) {
                              break
                            }

                            gridToBeAdded.push(gridRanges[i - indexer - 1])

                            indexer++
                          }

                          // console.log('indexer in getprice-----: ', indexer)
                        }

                        // console.log('gridToBeAdded',gridToBeAdded)
                        const pastOrders = db.Limitorders
                        let mergeOrderOpen = 0;
                        const mergeOrderIds = pastOrders
                          .filter(order => {
                            if (order.isMergeOrderOpen === true) {
                              mergeOrderOpen++;
                              return true;
                            }
                            return false;
                          })
                          .flatMap(order => order.orderIds);
                        const limitOrdersOld = pastOrders.filter(
                          (x) => x.isOrderOpen == true && x.limitOrderClosed == false && !mergeOrderIds.includes(x.systemId)
                        )
                        const marketLimitOrders = db.orders

                        // console.log('marketLimitOrders---', marketLimitOrders)

                        const findMarketLimitOrders = marketLimitOrders.filter(
                          (x) => x.isMarketFilled == false && x.isthisbuylimitOrder == true
                        )

                        const mergeOrders = [...limitOrdersOld, ...findMarketLimitOrders]
                        const getSystemId = mergeOrders.map((x) => x.systemId)
                        // console.log('all systemId: ', getSystemId)
                        saveLog(`ALL SYSTEM ID'S --- ${getSystemId}`)

                        //console.log('findMarketLimitOrders---', findMarketLimitOrders)

                        const totalLimitOrders =
                          findMarketLimitOrders.length + limitOrdersOld.length
                        console.log({ totalLimitOrders })
                        // console.log('totalLimitOrders---', totalLimitOrders)
                        // console.log('userEquity',equity)
                        // console.log('getOrderLimit(Number(equity)---', getOrderLimit(Number(equity)))
                        saveLog(`totalLimitOrders ${totalLimitOrders}`)


                        if (totalLimitOrders > getOrderLimit(Number(equity))) {
                          console.log('totalLimitOrders > getOrderLimit')
                          isTradeHappening = false
                          continue
                        }
                        //console.log('after continue')

                        const orderId = generateCustomOrderid(
                          5,
                          'else if(filterActiveOrders.length == 0)'
                        )

                        //console.log('orderId in trades---',orderId)

                        let generateOrderData = {
                          systemId: `${orderId}`,
                          pair: pair,
                          size,
                          priceBoughtOn: price,
                          triggerPrice: parseFloat(profitCalculate),
                          // priceBoughtOn: calculatePriceHike(price),
                          // triggerPrice: parseFloat(calculatePriceHike(price) + (calculatePriceHike(price) * profitPercentageC) / 100),
                          isOrderOpen: true,
                          gridSettingid: gridSettingid,
                          isMarketFilled: false,
                          limitOrderClosed: false,
                          finalOrderOpen: false,
                          isthisbuylimitOrder: false,
                          gridindex: i
                        }
                        db.orders.push(generateOrderData)
                        await saveCacheData(db)

                        // console.log({
                        //   priceBoughtOn: calculatePriceHike(price),
                        //   triggerPrice: parseFloat(calculatePriceHike(price) + (calculatePriceHike(price) * profitPercentageC) / 100)
                        // })
                        // console.log('above passData in getPrice--')
                        let passData =
                        {
                          "pair": pair,
                          "size": parsedSize,
                          "side": "buy",
                          "triggerPrice": price,
                          "oType": "LIMIT",
                          "price": price,
                          "memonic": enMemo,
                          "ordertype": "GTT",
                          "time": 1,
                          "timeFrame": "minute",
                          "reduceOnly": false,
                          "postOnly": false,
                          "network": netWorkType,
                          "orderid": `${orderId}`
                        }

                        // console.log('pass data in getPrice',passData)
                        try {
                          if (marketOrderToPlace) {
                            // delete passData.triggerPrice
                            // delete passData.oType
                            // delete passData.price
                            // delete passData.ordertype
                            // delete passData.time
                            // delete passData.orderid
                            // delete passData.postOnly
                            // delete passData.timeFrame
                            // console.log("marketOrderPlaced",passData)
                            passData.price = calculatePriceHike(price)
                            passData.triggerPrice = calculatePriceHike(price)
                            // console.log({ price, newPrice: calculatePriceHike(price) })
                            await axios.post(`${url}api/v1/limitorder`, passData);
                            // await axios.post(`${url}api/v1/limitorder`, passData);
                            saveLog(`getPrice buy order placed in if systemId: ${orderId}`)
                            marketOrderToPlace = false;
                          } else {
                            // await axios.post(`${url}api/v1/limitorder`, {...passData,price:calculatePriceHike(price)});
                            saveLog(`getPrice buy order placed in else systemId: ${orderId}`)
                            await axios.post(`${url}api/v1/limitorder`, passData);
                          }

                        } catch (error) {
                          db.orders.filter((order) => {
                            return order.systemId != generateOrderData.systemId
                          })
                          await saveCacheData(db)
                          console.log("Error while placing order in getPrice", error)
                          saveLog(`Error while placing order in getPrice, ${error}`)
                        }
                        if (totalLimitOrders + 2 < getOrderLimit(Number(equity))) {
                          await executeOtherOrders(
                            gridToBeAdded,
                            pair,
                            profitPercentageC,
                            gridSettingid,
                            margintoConsider,
                            parsedSize,
                            i,
                            url,
                          )
                        }


                        isTradeHappening = false
                      } else {
                        saveLog(`Price matched But Trade Happening ${marginFrom} - ${price} -${marginTo}`, false)
                      }
                    } else {
                      saveLog(`Price matched But Already Active Order ${marginFrom} - ${price} -${marginTo}`, false)
                    }
                  } else {
                    // saveLog(`Price Not matched ${marginFrom} - ${price} -${marginTo}`)
                    // console.log(`Price Not matched ${marginFrom} - ${price} -${marginTo}`)
                  }
                }
              }
            }
          }
        }
      }
    }
    isTradeHappening = false
  } catch (error) {
    console.log(error)
  }
}

export default getPrice
