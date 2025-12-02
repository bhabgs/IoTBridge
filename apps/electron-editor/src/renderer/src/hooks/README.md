# Hooks 使用说明

## useRTL

自动检测当前语言是否为 RTL（从右到左）语言，并更新文档方向。

### 支持 RTL 的语言

- 阿拉伯语 (ar)
- 希伯来语 (he)
- 波斯语 (fa)
- 乌尔都语 (ur)

### 使用示例

```tsx
import { useRTL } from './hooks/useRTL'

function MyComponent() {
  const isRTL = useRTL()
  
  return (
    <div>
      {isRTL ? 'RTL 布局' : 'LTR 布局'}
    </div>
  )
}
```

### 功能

- 自动检测当前语言是否为 RTL
- 自动更新 HTML 文档的 `dir` 属性
- 自动更新 HTML 文档的 `lang` 属性
- 监听语言变化并自动切换方向

## useTheme

主题管理 Hook，用于切换浅色/深色主题。

### 使用示例

```tsx
import { useTheme } from './hooks/useTheme'

function MyComponent() {
  const { mode, toggleMode, setMode } = useTheme()
  
  return (
    <button onClick={toggleMode}>
      当前主题: {mode}
    </button>
  )
}
```

