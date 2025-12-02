// 使用 require 方式导入 electron-store，避免 ESM/CommonJS 兼容性问题
// electron-store 在 CommonJS 环境下可能需要使用 .default
const ElectronStore = require('electron-store')
const Store = (ElectronStore.default || ElectronStore) as typeof import('electron-store').default

export interface AppSettings {
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US' | 'ar'
}

const defaultSettings: AppSettings = {
  theme: 'light',
  language: 'zh-CN'
}

export const settingsStore = new Store<AppSettings>({
  name: 'settings',
  defaults: defaultSettings
})

// 获取设置
export function getSettings(): AppSettings {
  return settingsStore.store
}

// 获取单个设置
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return settingsStore.get(key)
}

// 设置单个配置项
export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  settingsStore.set(key, value)
}

// 重置设置
export function resetSettings(): void {
  settingsStore.store = defaultSettings
}

