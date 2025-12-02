import { useEffect, useState } from 'react'
import { themeStore, ThemeState } from '../stores/themeStore'

export function useTheme() {
  const [state, setState] = useState<ThemeState>(themeStore.getState())

  useEffect(() => {
    const unsubscribe = themeStore.subscribe(setState)
    return unsubscribe
  }, [])

  return {
    ...state,
    setMode: themeStore.setMode.bind(themeStore),
    setConfig: themeStore.setConfig.bind(themeStore),
    toggleMode: themeStore.toggleMode.bind(themeStore)
  }
}

