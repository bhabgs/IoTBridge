import { I18nProvider } from './i18n'
import { Editor } from './pages/Editor'

function App(): React.JSX.Element {
  return (
    <I18nProvider>
      <Editor />
    </I18nProvider>
  )
}

export default App
