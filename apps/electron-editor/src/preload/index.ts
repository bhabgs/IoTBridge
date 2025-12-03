import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

contextBridge.exposeInMainWorld('electronAPI', {
  openWindow: (e) => {
    ipcRenderer.invoke('open-window', e)
  },
  // 设置相关 API
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setTheme: (theme: 'light' | 'dark') => ipcRenderer.invoke('set-theme', theme),
  setLanguage: (language: 'zh-CN' | 'en-US' | 'ar') => ipcRenderer.invoke('set-language', language),
  // 监听设置变化
  onSettingsChanged: (callback: (settings: { theme?: string; language?: string }) => void) => {
    ipcRenderer.on('settings-changed', (_, settings) => callback(settings))
  },
  // 移除监听器
  removeSettingsListener: () => {
    ipcRenderer.removeAllListeners('settings-changed')
  }
})
