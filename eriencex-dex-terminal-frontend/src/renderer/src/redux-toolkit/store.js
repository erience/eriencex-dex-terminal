import { combineReducers, configureStore } from '@reduxjs/toolkit'
import dataSlice from './dataSlice'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const rootReducer = combineReducers({
  data: dataSlice
})

const persistConfig = {
  key: 'root',
  storage,
  blacklist: ['data'] 
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer
})

export const persistor = persistStore(store)
