import Header from './components/Header'
import Announcement from './components/Announcement'
import TradeMain from './components/TradeMain'
import Footer from './components/Footer'
import { createContext } from 'react'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import { Provider } from 'react-redux'
import { persistor, store } from './redux-toolkit/store'
import { PersistGate } from 'redux-persist/integration/react'

export const Context = createContext()

function App() {
  return (
    <>
      <ToastContainer
        stacked
        position="top-right"
        autoClose={2000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Header />
          <Announcement />
          <TradeMain />
          <Footer />
        </PersistGate>
      </Provider>
    </>
  )
}

export default App
