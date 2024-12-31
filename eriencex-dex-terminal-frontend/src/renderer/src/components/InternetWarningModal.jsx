import React from 'react'

const InternetWarningModal = () => {
  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="modal-box max-w-md w-full p-6 pt-0 bg-white rounded shadow-lg">
          <div className="relative">
            <h3 className="font-bold text-lg text-center pt-6">Connection Lost</h3>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Please connect to the internet to continue using the application.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default InternetWarningModal
