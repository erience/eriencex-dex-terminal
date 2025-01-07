import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  pair: 'BTC-USD',
  server: 'MAINNET',
  chainAddress: '',
  gridSettings: [],
  blockHeight: 0,
  memonic: '',
  enMemonic: '',
  cryptoPair: [],
  openOrderData: [],
  tradesData: [],
  freeCollateral: 0,
  jsonData: {},
  pairTickSize: 1,
  tickerDecimals: {},
  userEquity: 0,
  API: 'https://indexer.dydx.trade/v4',
  baseURL: 'https://tradeapi.dydxboard.com/', // hosted URL - https://tradeapi.dydxboard.com/
  webSocketURL: 'wss://indexer.dydx.trade/v4/ws',
  isOnline: navigator.onLine,
  copyBotLog: []
}

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setPair: (state, action) => {
      state.pair = action.payload
    },
    setServer: (state, action) => {
      state.server = action.payload
      state.API =
        state.server === 'TESTNET'
          ? 'https://dydx-testnet.imperator.co/v4'
          : 'https://indexer.dydx.trade/v4'
      state.webSocketURL =
        state.server === 'TESTNET'
          ? 'wss://indexer.v4testnet.dydx.exchange/v4/ws'
          : 'wss://indexer.dydx.trade/v4/ws'
    },
    setChainAddress: (state, action) => {
      state.chainAddress = action.payload
    },
    setCryptoPair: (state, action) => {
      const { actionType, data } = action.payload

      if (actionType === 'append') {
        state.cryptoPair = [...data, ...state.cryptoPair]
      } else {
        state.cryptoPair = data
      }
    },
    setOpenOrderData: (state, action) => {
      state.openOrderData = action.payload
    },
    setTradesData: (state, action) => {
      const { actionType, data } = action.payload
      if (actionType === 'append') {
        state.tradesData = [...data, ...state.tradesData]
          .slice(0, 20)
          .filter((trade) => trade.size != 0)
      } else {
        state.tradesData = data
      }
    },
    setFreeCollateral: (state, action) => {
      state.freeCollateral = action.payload
    },
    setJsonData: (state, action) => {
      state.jsonData = action.payload
    },
    setBlockHeight: (state, action) => {
      state.blockHeight = action.payload
    },
    setMemonic: (state, action) => {
      state.memonic = action.payload
    },
    setEnMemonic: (state, action) => {
      state.enMemonic = action.payload
    },
    setPairTickSize: (state, action) => {
      state.pairTickSize = action.payload
    },
    setTickerDecimals: (state, action) => {
      state.tickerDecimals = action.payload
    },
    setUserEquity: (state, action) => {
      state.userEquity = action.payload
    },
    setGridSettings: (state, action) => {
      state.gridSettings = action.payload
    },
    setIsOnline: (state, action) => {
      state.isOnline = action.payload
    },
    setCopyBotLog: (state, action) => {
      state.copyBotLog = [...state.copyBotLog, action.payload];
      if (state.copyBotLog.length > 1000) {
        state.copyBotLog = state.copyBotLog.slice(-1000);
      }
    },
  }
})

export const {
  setPair,
  setServer,
  setChainAddress,
  setCryptoPair,
  setOpenOrderData,
  setTradesData,
  setFreeCollateral,
  setJsonData,
  setBlockHeight,
  setMemonic,
  setEnMemonic,
  setPairTickSize,
  setTickerDecimals,
  setUserEquity,
  setGridSettings,
  setIsOnline,
  setCopyBotLog
} = dataSlice.actions

export default dataSlice.reducer
export const selectData = (state) => state.data
