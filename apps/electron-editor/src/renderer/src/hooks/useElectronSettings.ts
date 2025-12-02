import { useEffect } from 'react'
import { useTheme } from './useTheme'
import { useTranslation } from 'react-i18next'

export function useElectronSettings() {
  const { setMode } = useTheme()
  const { i18n } = useTranslation()

  useEffect(() => {
    // 获取初始设置
    const loadSettings = async () => {
      try {
        if (window.electronAPI) {
          const settings = await window.electronAPI.getSettings()
          
          // 应用主题
          if (settings.theme) {
            setMode(settings.theme)
          }
          
          // 应用语言
          if (settings.language) {
            i18n.changeLanguage(settings.language)
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    loadSettings()

    // 监听设置变化
    if (window.electronAPI) {
      window.electronAPI.onSettingsChanged((settings) => {
        if (settings.theme) {
          setMode(settings.theme as 'light' | 'dark')
        }
        if (settings.language) {
          i18n.changeLanguage(settings.language)
        }
      })
    }

    // 清理监听器
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeSettingsListener()
      }
    }
  }, [setMode, i18n])
}

