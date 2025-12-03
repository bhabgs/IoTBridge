import styles from './index.module.less'
import { Header, PropertySettings, Canvas, Toolbox } from './components'
import { EditorProvider } from './context/EditorContext'

export default function Editor() {
  return (
    <EditorProvider>
      <div className={styles.editor}>
        <Header className={styles.editorHeader} />
        <div className={styles.editorContent}>
          <Toolbox className={styles.editorContentLeft} />
          <Canvas className={styles.editorContentCenter} />
          <PropertySettings className={styles.editorContentRight} />
        </div>
      </div>
    </EditorProvider>
  )
}
