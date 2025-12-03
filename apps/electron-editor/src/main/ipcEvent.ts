import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { isWebUrl } from 'utils'
import { getSettings } from './store'
import { createMenu } from './menu'

interface OpenWindowOptions {
  path?: string
  width?: number
  height?: number
}

export const ipcEvent = () => {
  // 打开流程图编辑窗口
  ipcMain.handle('open-window', (_, options: OpenWindowOptions) => {
    const { path, width = 1920, height = 1080 } = options
    const win = new BrowserWindow({
      width,
      height,
      show: false,
      autoHideMenuBar: false, // 显示菜单栏
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    // 为新窗口创建菜单
    createMenu(win)

    // 窗口准备好后发送设置信息
    win.on('ready-to-show', () => {
      win.show()
      // 发送初始设置到新窗口的渲染进程
      const settings = getSettings()
      win.webContents.send('settings-changed', settings)
    })

    if (isWebUrl(path)) {
      win.loadURL(path!)
    } else {
      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        console.log(process.env['ELECTRON_RENDERER_URL'] + (path || ''))
        win.loadURL(process.env['ELECTRON_RENDERER_URL'] + (path || ''))
      } else {
        win.loadFile(join(__dirname, '../renderer/index.html') + (path || ''))
      }
    }
  })
}
