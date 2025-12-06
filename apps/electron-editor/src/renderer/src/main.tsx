// 在 Electron 环境中，必须在任何 PixiJS 导入之前导入 unsafe-eval
import '@pixi/unsafe-eval'

import './assets/main.less'
import './i18n'

import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
