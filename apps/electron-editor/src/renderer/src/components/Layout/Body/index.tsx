import styles from './index.module.less'
const Body = (children: React.ReactNode) => {
  return <div className={styles.body}>{children}</div>
}

export default Body
