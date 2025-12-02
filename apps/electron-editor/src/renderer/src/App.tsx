import { ThemeProvider } from './components/ThemeProvider'
import { AppRouter } from './router'
import { useElectronSettings } from './hooks/useElectronSettings'

function App() {
  // 监听 Electron 设置变化
  useElectronSettings()

  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}

export default App
