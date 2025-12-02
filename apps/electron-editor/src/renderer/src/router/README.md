# 路由系统使用说明

## 路由结构

应用使用 React Router v7 进行路由管理，采用嵌套路由结构。

### 路由配置

```tsx
/                    # 首页 (Home)
/editor             # 编辑器页面
/preview            # 预览页面
/settings           # 设置页面
```

## 添加新路由

### 1. 创建页面组件

在 `pages/` 目录下创建新的页面组件：

```tsx
// pages/NewPage/index.tsx
import { Typography } from 'antd'
import { useTranslation } from 'react-i18next'

const { Title } = Typography

export default function NewPage() {
  const { t } = useTranslation()
  
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>新页面</Title>
    </div>
  )
}
```

### 2. 在路由配置中添加

在 `router/index.tsx` 中添加新路由：

```tsx
import NewPage from '../pages/NewPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutBody />,
    children: [
      // ... 其他路由
      {
        path: 'new-page',
        element: <NewPage />
      }
    ]
  }
])
```

### 3. 在导航菜单中添加

在 `components/Layout/Layout.tsx` 的 `menuItems` 中添加菜单项：

```tsx
{
  key: '/new-page',
  icon: <SomeIcon />,
  label: t('menu.newPage')
}
```

### 4. 添加翻译

在 `i18n/locales/` 下的语言文件中添加翻译：

```json
{
  "menu": {
    "newPage": "新页面"
  }
}
```

## 编程式导航

使用 `useNavigate` Hook 进行编程式导航：

```tsx
import { useNavigate } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate('/editor')
  }
  
  return <button onClick={handleClick}>跳转到编辑器</button>
}
```

## 获取当前路由信息

使用 `useLocation` Hook 获取当前路由信息：

```tsx
import { useLocation } from 'react-router-dom'

function MyComponent() {
  const location = useLocation()
  
  console.log(location.pathname) // 当前路径
}
```

## 路由参数

### 定义带参数的路由

```tsx
{
  path: 'editor/:id',
  element: <Editor />
}
```

### 获取路由参数

```tsx
import { useParams } from 'react-router-dom'

function Editor() {
  const { id } = useParams()
  // ...
}
```

## 嵌套路由

如果需要更复杂的嵌套路由，可以在页面组件中使用 `<Outlet />`：

```tsx
// 父路由
{
  path: 'editor',
  element: <EditorLayout />,
  children: [
    {
      path: 'canvas',
      element: <Canvas />
    },
    {
      path: 'properties',
      element: <Properties />
    }
  ]
}
```

