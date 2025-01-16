const { contextBridge, ipcRenderer } = require('electron')

const api = {
  hello: () => {
    console.log('hello from preload')
  }
}

contextBridge.exposeInMainWorld('electron', {
  fetchGridData: (pair, gridData) => {
    return ipcRenderer.invoke('fetch-grid-data', pair, gridData)
  },
  closeGridBot: (index) => {
    return ipcRenderer.invoke('close-grid-bot', index)
  },
  handleNetworkChange: () => {
    return ipcRenderer.invoke("handle-network-change");
  },
  startGridBot: (index) => {
    return ipcRenderer.invoke('start-grid-bot', index)
  },
  setProfile: (seedPhrash, serverCheck) => {
    return ipcRenderer.invoke('set-profile', seedPhrash, serverCheck)
  },
  startWebSocket: (pair, size, url) => {
    return ipcRenderer.invoke('start-web-socket', pair, size, url)
  },
  startSubAccWebSocket: (userAddress, size, url, grid) => {
    return ipcRenderer.invoke('start-sub-acc-web-socket', userAddress, size, url, grid)
  },
  setSecretPhrash: (data) => ipcRenderer.invoke('secretPhrash-set', data),
  getSecretPhrash: () => ipcRenderer.invoke('secretPhrash-get'),
  removeSecretPhrash: () => ipcRenderer.invoke('remove-secretPhrash'),
  getDBData: () => ipcRenderer.invoke('getDBData'),
  updateDBData: (index, obj) => ipcRenderer.invoke('updateDBData', index, obj),
  encryptData: (data) => ipcRenderer.invoke('encryptData', data),
  clearJSON: (gridId) => ipcRenderer.invoke('clearJSON', gridId),
  addEquity: (equity) => ipcRenderer.invoke('addEquity', equity),
  cancelAllOrders: (orders) => ipcRenderer.invoke('cancelAllOrders', orders),
  printlogs: (message) => ipcRenderer.invoke('printlogs', message)
})

ipcRenderer.on('fetch-grid-error', (event, data) => {
  window.dispatchEvent(new CustomEvent('griderror', data))
})

ipcRenderer.on('new-grid-data', (event, data) => {
  window.dispatchEvent(new CustomEvent('sendgriddata', data))
})
