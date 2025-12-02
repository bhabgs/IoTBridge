# 主题配置使用说明

## 使用主题 Hook

```tsx
import { useTheme } from '../hooks/useTheme'

function MyComponent() {
  const { mode, config, setMode, toggleMode } = useTheme()
  
  return (
    <button onClick={toggleMode}>
      当前主题: {mode}
    </button>
  )
}
```

## 自定义主题配置

```tsx
import { useTheme } from '../hooks/useTheme'
import { ThemeConfig } from 'antd'

function MyComponent() {
  const { setConfig } = useTheme()
  
  const customTheme: ThemeConfig = {
    token: {
      colorPrimary: '#ff4d4f',
      borderRadius: 8
    }
  }
  
  setConfig(customTheme)
}
```

## 主题持久化

主题配置会自动保存到 `localStorage`，下次打开应用时会自动恢复。

