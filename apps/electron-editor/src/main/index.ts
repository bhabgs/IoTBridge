import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createMenu } from './menu'
import { getSettings, setSetting } from './store'
import { ipcEvent } from './ipcEvent'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    autoHideMenuBar: false, // 显示菜单栏
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // 支持 PixiJS WebGL
      webgl: true,
      // 启用硬件加速以提升 PixiJS 性能
      enableWebSQL: false,
      offscreen: false
    }
  })

  // 创建菜单
  if (mainWindow) {
    createMenu(mainWindow)
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // 发送初始设置到渲染进程
    const settings = getSettings()
    mainWindow?.webContents.send('settings-changed', settings)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/editor/1')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handlers for settings
  ipcMain.handle('get-settings', () => {
    return getSettings()
  })

  // 向所有窗口广播设置变化
  const broadcastSettings = (settings: { theme?: string; language?: string }) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send('settings-changed', settings)
        // 更新菜单状态
        createMenu(window)
      }
    })
  }

  ipcMain.handle('set-theme', (_, theme: 'light' | 'dark') => {
    setSetting('theme', theme)
    broadcastSettings({ theme })
    return true
  })

  ipcMain.handle('set-language', (_, language: 'zh-CN' | 'en-US' | 'ar') => {
    setSetting('language', language)
    broadcastSettings({ language })
    return true
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcEvent()
