import React, { useEffect, useRef } from 'react'
import logo from '../assets/images/logo.webp'
import { FaBars, FaUser } from 'react-icons/fa'
import MemonicModal from './MemonicModal'
import erienceLogo from '../assets/images/erience-logo.png'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectData,
  setMemonic,
  setServer,
  setChainAddress,
  setFreeCollateral,
  setEnMemonic,
  setIsOnline
} from '../redux-toolkit/dataSlice'
import InternetWarningModal from './InternetWarningModal'

const Header = () => {
  const { server, memonic, baseURL, enMemonic, isOnline } = useSelector(selectData)
  const dispatch = useDispatch()

  const menuWrapperRef = useRef(null)

  useEffect(() => {
    console.log('125 in header', isOnline)
  }, [isOnline])

  const menuToggle = () => {
    if (menuWrapperRef.current) {
      menuWrapperRef.current.classList.toggle('active')
    }
  }

  const getSecretPhrashFromJSON = async () => {
    try {
      const res = await window.electron.getSecretPhrash()
      const enmemo = await window.electron.encryptData(res?.seed)
      dispatch(setMemonic(res?.seed))
      dispatch(setEnMemonic(enmemo))
    } catch (error) {
      console.log('error while getting seed')
    }
  }

  useEffect(() => {
    getSecretPhrashFromJSON()
    const handleOnlineStatusChange = () => {
      dispatch(setIsOnline(navigator.onLine))
    }

    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange)
      window.removeEventListener('offline', handleOnlineStatusChange)
    }
  }, [])

  useEffect(() => {
    dispatch(setFreeCollateral(0))
  }, [server])

  const getWalletAddress = async () => {
    try {
      if (memonic) {
        const res = await axios.post(`${baseURL}api/v1/getWalletfrommemonic`, {
          memonic: enMemonic,
          network: server
        })
        const data = res.data
        // setChainAddress(data?.wallet)
        dispatch(setChainAddress(data?.wallet))
      }
    } catch (err) {
      console.log(err)
    }
  }

  const setDefaultProfile = async () => {
    const serverCheck = server == 'TESTNET'
    if (memonic != '') {
      await window.electron.setProfile(memonic, serverCheck)
    }
  }

  useEffect(() => {
    setDefaultProfile()
  }, [server, memonic])

  useEffect(() => {
    if (memonic != '') {
      getWalletAddress()
    }
  }, [memonic, enMemonic])

  return (
    <>
      <header className="sticky top-0 left-0 w-full bg-dark z-[999]">
        <div className="container">
          <div className="w-full flex items-center justify-between gap-x-3 py-5 xxl:py-3">
            <div className="flex items-center gap-3">
              <a href="#" className="relative block">
                <img src={erienceLogo} alt="logo" className="w-[150px]" />
              </a>
              <span className="scale-150">🤝</span>
              <a href="#" className="relative block">
                <img src={logo} alt="logo" className="w-[100px]" />
              </a>
            </div>

            <div className="menu-wrapper" ref={menuWrapperRef}>
              <div className="menu-backdrop" onClick={menuToggle}></div>
            </div>

            <div className="relative flex items-center gap-x-4">
              <select
                value={server}
                onChange={(e) => dispatch(setServer(e.target.value))}
                className="px-2 py-1 w-28 bg-semi-dark rounded-sm cursor-pointer"
              >
                <option value="MAINNET">Mainnet</option>
                <option value="TESTNET">Testnet</option>
              </select>
              <button
                type="button"
                className="relative w-[18px] h-[18px] text-xs inline-flex items-center justify-center rounded-full bg-white text-black"
                onClick={() => document.getElementById('add_memonic_modal').showModal()}
              >
                <FaUser />
              </button>
              <MemonicModal />
            </div>
          </div>
        </div>
      </header>
      {isOnline == false && <InternetWarningModal />}
    </>
  )
}

export default Header
