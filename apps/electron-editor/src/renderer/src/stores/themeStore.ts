import { ThemeConfig, theme as antdTheme } from 'antd'

export type ThemeMode = 'light' | 'dark'

export interface ThemeState {
  mode: ThemeMode
  config: ThemeConfig
}

const STORAGE_KEY = 'electron-editor-theme'

// 默认主题配置
const defaultLightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6
  },
  algorithm: antdTheme.defaultAlgorithm
}

const defaultDarkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6
  },
  algorithm: antdTheme.darkAlgorithm
}

class ThemeStore {
  private state: ThemeState = {
    mode: 'light',
    config: defaultLightTheme
  }

  private listeners: Array<(state: ThemeState) => void> = []

  constructor() {
    this.loadFromStorage()
  }

  // 从本地存储加载
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const mode = parsed.mode || 'light'
        this.state = {
          mode,
          config: parsed.config || (mode === 'dark' ? defaultDarkTheme : defaultLightTheme)
        }
      }
    } catch (error) {
      console.error('Failed to load theme from storage:', error)
    }
  }

  // 保存到本地存储
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (error) {
      console.error('Failed to save theme to storage:', error)
    }
  }

  // 获取当前状态
  getState(): ThemeState {
    return { ...this.state }
  }

  // 设置主题模式
  setMode(mode: ThemeMode): void {
    this.state.mode = mode
    this.saveToStorage()
    this.notifyListeners()
  }

  // 设置主题配置
  setConfig(config: ThemeConfig): void {
    this.state.config = config
    this.saveToStorage()
    this.notifyListeners()
  }

  // 切换主题模式
  toggleMode(): void {
    this.setMode(this.state.mode === 'light' ? 'dark' : 'light')
  }

  // 订阅主题变化
  subscribe(listener: (state: ThemeState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  // 通知监听器
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()))
  }
}

export const themeStore = new ThemeStore()
