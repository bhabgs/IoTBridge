import { ConfigProvider, theme as antdTheme } from 'antd'
import { ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useRTL } from '../hooks/useRTL'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode, config } = useTheme()
  const isRTL = useRTL()

  const themeConfig: typeof config = {
    ...config,
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
  }

  return (
    <ConfigProvider theme={themeConfig} direction={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </ConfigProvider>
  )
}

