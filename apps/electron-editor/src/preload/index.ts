import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Custom API for renderer (合并到 electronAPI)
const customAPI = {
  openWindow: (e: any) => {
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
}

// 合并自定义 API 到 electronAPI
const mergedElectronAPI = { ...electronAPI, ...customAPI }

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', mergedElectronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', customAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = mergedElectronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.electronAPI = customAPI
}
