import { app, shell, BrowserWindow, ipcMain, screen, Menu, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import startWebSocket, { stopWebSocket } from '../../Backend/tickerListener'
import startWebSocketSubAccount, {
  closeWebSocketSubAccount
} from '../../Backend/subAccountswsconnect'
import { intialStructure } from '../../Backend/initialStructure'
import {
  allJson,
  cancelAllOrders,
  clearJSON,
  getCacheData,
  getJsonData,
  printLog,
  saveCacheData,
  saveJsonData
} from '../../Backend/helper'
import electronuUpdater from 'electron-updater'
const { autoUpdater } = electronuUpdater
import crypto from 'crypto'

const fs = require('fs')
const path = require('path')
const dbpath = path.join(app.getPath('userData'), 'data', 'db.json')
const storage = require('electron-localstorage')
let downloadInProgress = false

autoUpdater.setFeedURL({
  provider: 'github',
  repo: 'eriencex-dex-terminal',
  owner: 'erience',
  private: false
})
// autoUpdater.forceDevUpdateConfig = true
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true
let showNoDownload = false
const menuTemplate = {
  id: 'home',
  label: 'Home',
  submenu: [
    {
      label: `Version v${app.getVersion()}`,
      click: () => {
        autoUpdater.checkForUpdatesAndNotify()
        showNoDownload = true
      }
    },
    {
      id: 'exit',
      label: 'Exit App',
      click() {
        app.quit()
      }
    }
  ]
}

let mainWindow
function createWindow() {
  // Create the browser window.
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    autoHideMenuBar: false,
    icon: join(__dirname, '../../public/icon.png'),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
      // devTools: true
      devTools: !app.isPackaged
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.webContents.openDevTools()
  })

  const edit = {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        selector: 'redo:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:'
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:'
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:'
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:'
      },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        selector: 'reload:'
      }
    ]
  }

  const template = [menuTemplate, edit]

  mainWindow?.webContents.on('did-finish-load', async () => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  app.on('browser-window-focus', () => {
    globalShortcut.register('CommandOrControl+R', () => {
      mainWindow.reload()
      handleBeforeQuit(allJson.dbpath)
    })
  })

  app.on('browser-window-blur', () => {
    globalShortcut.unregister('CommandOrControl+R')
  })
}

const intiateStaticFile = () => {
  const dataFolderPath = path.join(app.getPath('userData'), 'data')

  if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath, { recursive: true })
  }

  const filePaths = [
    { fileName: 'db.json', initialData: intialStructure.db },
    { fileName: 'id.json', initialData: intialStructure.id },
    { fileName: 'errors.json', initialData: intialStructure.errors },
    { fileName: 'history.json', initialData: intialStructure.history }
  ]
  filePaths.forEach(({ fileName, initialData }) => {
    const filePath = path.join(app.getPath('userData'), 'data', fileName)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, initialData)
    }
  })
}
app.whenReady().then(() => {
  intiateStaticFile()
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  autoUpdater.checkForUpdatesAndNotify()
  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.

    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('ready', () => {
  autoUpdater.checkForUpdates()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

const handleBeforeQuit = async () => {
  try {
    const jsonData = await getCacheData()
    if (jsonData) {
      jsonData.allGridSettings.forEach((settings) => {
        settings.isGridActive = false
      })
      await saveJsonData(allJson.dbpath, jsonData)
    }
  } catch (error) {
    console.error('Error handling JSON data:', error)
  }
}

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await handleBeforeQuit()
    app.quit()
  }
})

app.on('quit', () => {
  globalShortcut.unregisterAll()
})

// ------------------------ Updater ------------------------------
autoUpdater.on('update-not-available', () => {
  const message = `No Update available, you are using latest version ${version}`
  const buttons = ['ok']
  dialog.showMessageBox({ type: 'question', buttons, message })
})

autoUpdater.on('update-downloaded', () => {
  const message = 'Updates have been downloaded. Do you want to Install it now?'
  const buttons = ['Yes', 'No']
  dialog.showMessageBox({ type: 'question', buttons, message }).then((result) => {
    if (result.response == 0) {
      autoUpdater.quitAndInstall()
    } else {
      autoUpdater.autoInstallOnAppQuit = true
    }
  })
})

autoUpdater.on('download-progress', (progressObj) => {
  downloadInProgress = true
  const percentage = Math.floor(progressObj.percent)
  mainWindow?.setProgressBar(percentage / 100)

  if (percentage == 100) {
    setTimeout(() => {
      mainWindow?.setProgressBar(0)
      downloadInProgress = false
    }, 1000 * 60)
  }
})

autoUpdater.on('error', (error) => {
  dialog.showMessageBox({
    type: 'error',
    message: 'Oops! Something went wrong, while checking for updates.'
  })
})

async function encryptRSA(message) {
  const publicKey = import.meta.env.VITE_PUBLIC_KEY
  if (!publicKey) {
    throw new Error('Public key is missing. Check your configuration.')
  }
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

// ----------------------------------------------------------------

ipcMain.handle('fetch-grid-data', async (event, pair, gridData) => {
  try {
    console.log('fetch-grid-data called')
    const jsonData = await getCacheData()

    const activeGrid = jsonData.allGridSettings.some(
      (item) => item.pair === pair && item.isGridActive
    )

    if (activeGrid) {
      console.log('Cannot add new grid: pair exists and isGridActive is true')
    } else {
      const newObj = { ...gridData, pair }
      jsonData.allGridSettings.push(newObj)
      await saveCacheData(jsonData)
    }
  } catch (error) {
    console.error('Error updating db.json:', error)
  }
})

// Grid Bot Start-End Functions
ipcMain.handle('close-grid-bot', async (event, index) => {
  try {
    const jsonData = await getCacheData()

    if (index >= 0 && index < jsonData.allGridSettings.length) {
      jsonData.allGridSettings[index].isGridActive = false
      await saveCacheData(jsonData)
      await closeWebSocketSubAccount()
      await stopWebSocket()
      return {
        status: 'success',
        message: 'Grid closed successfully!'
      }
    } else {
      return { status: 'error', message: 'Invalid index.' }
    }
  } catch (error) {
    console.error('Error updating db.json:', error)
    return { status: 'error', message: 'Failed to close grid bot.' }
  }
})

ipcMain.handle('start-grid-bot', async (event, index) => {
  try {
    const jsonData = await getCacheData()

    if (index >= 0 && index < jsonData.allGridSettings.length) {
      jsonData.allGridSettings[index].isGridActive = true
      await saveCacheData(jsonData)

      return { status: 'success', message: 'Grid started successfully!' }
    } else {
      return { status: 'error', message: 'Invalid index.' }
    }
  } catch (error) {
    console.error('Error updating db.json:', error)
    return { status: 'error', message: 'Failed to start grid.' }
  }
})

ipcMain.handle('set-profile', async (event, seedPhrash, serverCheck) => {
  try {
    const jsonData = await getCacheData()
    if (jsonData.profileSettings && jsonData.profileSettings.length > 0) {
      jsonData.profileSettings[0].memonic = seedPhrash
      jsonData.profileSettings[0].testnet = serverCheck
      jsonData.profileSettings[0].userEquity = 0
      await saveCacheData(jsonData)
    } else {
      console.error('Profile settings not found')
    }
  } catch (error) {
    console.error('Error updating profile settings:', error)
  }
})

ipcMain.handle('start-web-socket', async (event, pair, size, url) => {
  startWebSocket(pair, size, url)
})

ipcMain.handle('start-sub-acc-web-socket', async (event, userAddress, size, url, grid) => {
  startWebSocketSubAccount(userAddress, size, url, grid)
})

// Handle SecretPhrash
ipcMain.handle('secretPhrash-set', async (event, data) => {
  try {
    storage.setItem('secretPhrash', data)
    return { status: true }
  } catch (err) {
    console.log('error in secretPhrash set', err)
    return new Error('error in secretPhrash set')
  }
})
ipcMain.handle('secretPhrash-get', async (event) => {
  try {
    const seed = storage.getItem('secretPhrash')
    return { status: true, seed }
  } catch (err) {
    return new Error('error in secretPhrash get')
  }
})
ipcMain.handle('remove-secretPhrash', async (event) => {
  try {
    storage.removeItem('secretPhrash')
    const jsonData = await getCacheData()
    jsonData.profileSettings[0].memonic = ''
    await saveCacheData(jsonData)
    return { status: true }
  } catch (err) {
    console.log('error in secretPhrash get', err)
    return new Error('error in secretPhrash remove')
  }
})

// Update on JSON Files
ipcMain.handle('getDBData', async () => {
  const jsonData = await getCacheData()
  return jsonData
})

ipcMain.handle('updateDBData', async (event, index, obj) => {
  try {
    const jsonData = await getCacheData()
    jsonData.allGridSettings[index] = obj
    await saveCacheData(jsonData)
  } catch (error) {
    console.error('Error updating db.json:', error)
    return { status: false, error: 'Failed to update data.' }
  }
})

ipcMain.handle('clearJSON', async () => {
  try {
    clearJSON()
  } catch (err) {
    console.error('Error clearing JSON:', err)
    return { status: false, error: 'Failed to clear JSON.' }
  }
})
// Encrypt SecretPhrash
ipcMain.handle('encryptData', async (event, body) => {
  try {
    const enMsg = await encryptRSA(body)
    return enMsg
  } catch (error) {
    return { status: false, error: error.message }
  }
})

ipcMain.handle('addEquity', async (event, equity) => {
  try {
    const jsonData = await getCacheData()
    jsonData.profileSettings[0].userEquity = equity
    await saveCacheData(jsonData)
  } catch (error) {
    console.error('Error adding equity:', error)
    return { status: false, error: 'Failed to add equity.' }
  }
})

ipcMain.handle('cancelAllOrders', async (event, orders) => {
  try {
    // console.log('orders in main index',orders)
    await cancelAllOrders(orders)
  } catch (error) {
    console.error('Error canceling all orders:', error)
    return { status: false, error: 'Failed to add equity.' }
  }
})

ipcMain.handle('printlogs', async (event, message) => {
  try {
    printLog(message)
  } catch (error) {
    console.error('Error print:', error)
    return { status: false, error: 'Failed to print.' }
  }
})

