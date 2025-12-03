import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { isWebUrl } from 'utils'

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
      webPreferences: {
        // preload: join(__dirname, '../preload/index.js')
      }
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
