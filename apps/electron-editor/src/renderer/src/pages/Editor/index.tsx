import styles from './index.module.less'
import { Header, PropertySettings, Canvas, Toolbox } from './components'

export default function Editor() {
  return (
    <div className={styles.editor}>
      <Header className={styles.editorHeader} />
      <div className={styles.editorContent}>
        <Toolbox className={styles.editorContentLeft} />
        <Canvas className={styles.editorContentCenter} />
        <PropertySettings className={styles.editorContentRight} />
      </div>
    </div>
  )
}
