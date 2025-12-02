import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    electronAPI: {
      openNewWindow: (path?: string) => Promise<void>
      getSettings: () => Promise<{ theme: 'light' | 'dark'; language: 'zh-CN' | 'en-US' | 'ar' }>
      setTheme: (theme: 'light' | 'dark') => Promise<boolean>
      setLanguage: (language: 'zh-CN' | 'en-US' | 'ar') => Promise<boolean>
      onSettingsChanged: (callback: (settings: { theme?: string; language?: string }) => void) => void
      removeSettingsListener: () => void
    }
  }
}
