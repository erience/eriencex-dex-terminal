import React, { useState } from 'react'
import { showToast } from '../utils/helper'
import { useDispatch } from 'react-redux'
import { setChainAddress } from '../redux-toolkit/dataSlice'

const AddressModal = () => {
  const [address, setAddress] = useState('')
  const dispatch = useDispatch()
  const dydxExchangeAddressRegex = /^dydx[0-9a-z]{39}$/

  const handleSet = () => {
    const enteredAddress = address.trim()

    if (!dydxExchangeAddressRegex.test(enteredAddress)) {
      showToast(
        'Invalid address format. Please enter a valid dYdX exchange chain address.',
        'error'
      )
      return
    }

    if (address !== '') {
      dispatch(setChainAddress(address))
      showToast('Address added', 'success')
      document.getElementById('add_address_modal').close()
    } else {
      showToast('Please enter an address to fetch order details.', 'warning')
    }
  }

  return (
    <>
      <dialog id="add_address_modal" className="modal">
        <div className="modal-box">
          {/* <method="dialog"> */}
          {/* if there is a button in form, it will close the modal */}
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-3 top-4 z-10"
            onClick={() => document.getElementById('add_address_modal').close()}
          >
            ✕
          </button>

          {/* MODAL CONTENT START */}
          <div className="relative mb-8">
            <h3 className="font-bold text-lg">Chain Address</h3>
          </div>
          <div className="relative">
            <form className="grid grid-cols-1 gap-y-4">
              <div className="relative">
                <label className="block mb-1.5">Set address</label>
                <input
                  type="text"
                  placeholder="Enter Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="relative w-full h-11 p-2 border border-gray-400 outline-none rounded-md bg-transparent"
                />
              </div>
              <div className="relative text-center">
                <button
                  type="button"
                  className="relative btn inline-block py-2.5 px-6 rounded-md bg-black text-white hover:text-black"
                  onClick={handleSet}
                >
                  Add Address
                </button>
              </div>
            </form>
          </div>
          {/* MODAL CONTENT END */}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  )
}

export default AddressModal
