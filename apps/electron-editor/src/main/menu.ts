import { app, Menu, BrowserWindow } from 'electron'
import { getSettings, setSetting } from './store'

// 菜单标签翻译
const menuLabels = {
  'zh-CN': {
    file: '文件',
    edit: '编辑',
    view: '视图',
    settings: '设置',
    help: '帮助',
    theme: '主题',
    language: '语言',
    light: '浅色',
    dark: '深色',
    chinese: '中文',
    english: 'English',
    arabic: 'العربية',
    preferences: '偏好设置',
    about: '关于',
    quit: '退出',
    close: '关闭'
  },
  'en-US': {
    file: 'File',
    edit: 'Edit',
    view: 'View',
    settings: 'Settings',
    help: 'Help',
    theme: 'Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
    chinese: '中文',
    english: 'English',
    arabic: 'العربية',
    preferences: 'Preferences',
    about: 'About',
    quit: 'Quit',
    close: 'Close'
  },
  'ar': {
    file: 'ملف',
    edit: 'تعديل',
    view: 'عرض',
    settings: 'الإعدادات',
    help: 'مساعدة',
    theme: 'المظهر',
    language: 'اللغة',
    light: 'فاتح',
    dark: 'داكن',
    chinese: '中文',
    english: 'English',
    arabic: 'العربية',
    preferences: 'التفضيلات',
    about: 'حول',
    quit: 'خروج',
    close: 'إغلاق'
  }
}

function getMenuLabels() {
  const language = getSettings().language
  return menuLabels[language] || menuLabels['zh-CN']
}

export function createMenu(mainWindow: BrowserWindow): void {
  const labels = getMenuLabels()
  const settings = getSettings()

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.getName(),
      submenu: [
        { role: 'about' as const, label: labels.about },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        {
          role: 'quit' as const,
          label: labels.quit
        }
      ]
    },
    {
      label: labels.file,
      submenu: [
        { role: 'close' as const, label: labels.close },
        { type: 'separator' as const },
        {
          label: labels.quit,
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: labels.edit,
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const }
      ]
    },
    {
      label: labels.view,
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },
    {
      label: labels.settings,
      submenu: [
        {
          label: labels.theme,
          submenu: [
            {
              label: labels.light,
              type: 'radio' as const,
              checked: settings.theme === 'light',
              click: () => {
                setSetting('theme', 'light')
                mainWindow.webContents.send('settings-changed', { theme: 'light' })
                // 重新创建菜单以更新选中状态
                createMenu(mainWindow)
              }
            },
            {
              label: labels.dark,
              type: 'radio' as const,
              checked: settings.theme === 'dark',
              click: () => {
                setSetting('theme', 'dark')
                mainWindow.webContents.send('settings-changed', { theme: 'dark' })
                // 重新创建菜单以更新选中状态
                createMenu(mainWindow)
              }
            }
          ]
        },
        {
          label: labels.language,
          submenu: [
            {
              label: labels.chinese,
              type: 'radio' as const,
              checked: settings.language === 'zh-CN',
              click: () => {
                setSetting('language', 'zh-CN')
                mainWindow.webContents.send('settings-changed', { language: 'zh-CN' })
                // 重新创建菜单以更新语言和选中状态
                createMenu(mainWindow)
              }
            },
            {
              label: labels.english,
              type: 'radio' as const,
              checked: settings.language === 'en-US',
              click: () => {
                setSetting('language', 'en-US')
                mainWindow.webContents.send('settings-changed', { language: 'en-US' })
                // 重新创建菜单以更新语言和选中状态
                createMenu(mainWindow)
              }
            },
            {
              label: labels.arabic,
              type: 'radio' as const,
              checked: settings.language === 'ar',
              click: () => {
                setSetting('language', 'ar')
                mainWindow.webContents.send('settings-changed', { language: 'ar' })
                // 重新创建菜单以更新语言和选中状态
                createMenu(mainWindow)
              }
            }
          ]
        },
        { type: 'separator' as const },
        {
          label: labels.preferences,
          accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
          click: () => {
            // 可以打开设置窗口或跳转到设置页面
            mainWindow.webContents.send('open-settings')
          }
        }
      ]
    },
    {
      label: labels.help,
      submenu: [
        {
          label: labels.about,
          click: () => {
            // 可以打开关于对话框
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
