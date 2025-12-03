import { useEffect } from 'react'
import styles from './index.module.less'

export default function Preview() {
  useEffect(() => {
    window.document.title = '工艺流程图预览 - Flow Design'
    setTimeout(() => {
      // 隐藏预览提示
      const previewTip = document.querySelector(`.${styles.previewTip}`)
      if (previewTip) {
        ;(previewTip as HTMLElement).style.display = 'none'
      }
    }, 5000)
  }, [])
  return (
    <>
      <div className={styles.preview}></div>
      <div className={styles.previewTip}>预览模式，请使用鼠标拖动进行浏览</div>
    </>
  )
}
