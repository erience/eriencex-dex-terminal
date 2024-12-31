import React, { useEffect, useState } from 'react'
import { showToast } from '../utils/helper'
import { useDispatch, useSelector } from 'react-redux'
import { selectData, setEnMemonic, setJsonData, setMemonic } from '../redux-toolkit/dataSlice'

const MemonicModal = () => {
  const { server } = useSelector(selectData)
  const [seedPhrash, setSeedPhrash] = useState('')
  const dispatch = useDispatch()

  const getSeedFromJSON = async () => {
    try {
      const res = await window.electron.getSecretPhrash()
      setSeedPhrash(res?.seed)
    } catch (error) {
      console.log('error while getting seed')
    }
  }

  useEffect(() => {
    getSeedFromJSON()
  }, [])

  const handleSet = async () => {
    if (seedPhrash != '') {
      await window.electron.setSecretPhrash(seedPhrash)
      sessionStorage.setItem('memonic', seedPhrash)
      const enmemo = await window.electron.encryptData(seedPhrash)
      dispatch(setMemonic(seedPhrash))
      dispatch(setEnMemonic(enmemo))

      const serverCheck = server == 'TESTNET'
      await window.electron.setProfile(seedPhrash, serverCheck)
      const res = await window.electron.getDBData()
      dispatch(setJsonData(res))

      showToast('Set Successfully', 'success')

      document.getElementById('add_memonic_modal').close()
    } else {
      showToast('Please add memonic', 'warning')
    }
  }

  const handleRemove = async () => {
    setSeedPhrash('')
    await window.electron.removeSecretPhrash()
    dispatch(setMemonic(''))
    dispatch(setEnMemonic(''))
  }

  return (
    <dialog id="add_memonic_modal" className="modal bg-black/[0.6]">
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-4 z-10"
          onClick={() => document.getElementById('add_memonic_modal').close()}
        >
          ✕
        </button>

        <div className="relative mb-8">
          <h3 className="font-bold text-lg">Secret Phrash</h3>
        </div>
        <div className="relative">
          <form className="grid grid-cols-1 gap-y-4">
            <div className="relative">
              <label className="block mb-1.5">Set Secret Phrase</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Memonic"
                  value={seedPhrash}
                  onChange={(e) => setSeedPhrash(e.target.value)}
                  className="relative w-full h-11 p-2 border border-gray-400 outline-none rounded-md bg-transparent"
                />
              </div>
            </div>
            <div className="relative text-center">
              <button
                type="button"
                className="relative me-2 btn inline-block py-2.5 px-6 rounded-md bg-black text-white hover:text-black"
                onClick={handleSet}
              >
                Add
              </button>
              <button
                type="button"
                className="relative btn inline-block py-2.5 px-6 rounded-md bg-black text-white hover:text-black"
                onClick={handleRemove}
              >
                Remove
              </button>
            </div>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}

export default MemonicModal
