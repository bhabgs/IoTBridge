# 国际化 (i18n) 使用说明

## 支持的语言

- 中文 (zh-CN)
- English (en-US)
- العربية (ar) - 支持 RTL 布局

## 添加新语言

1. 在 `locales/` 目录下创建新的语言文件，例如 `ja-JP.json`
2. 在 `i18n/index.ts` 中导入并添加到 `resources` 对象
3. 如果是 RTL 语言，在 `hooks/useRTL.ts` 的 `RTL_LANGUAGES` 数组中添加语言代码

## 使用翻译

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <div>{t('common.save')}</div>
}
```

## 切换语言

使用 `LanguageSwitcher` 组件，或直接调用：

```tsx
import { useTranslation } from 'react-i18next'

const { i18n } = useTranslation()
i18n.changeLanguage('ar') // 切换到阿拉伯语，会自动启用 RTL
```

## RTL 支持

应用会自动检测 RTL 语言（阿拉伯语、希伯来语、波斯语、乌尔都语）并切换布局方向。Antd 组件会自动适配 RTL 布局。
