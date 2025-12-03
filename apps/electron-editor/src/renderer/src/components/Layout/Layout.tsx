import { Layout } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import styles from './layout.module.less'

const LayoutBody = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // 首页不显示返回按钮
  const showBackButton = location.pathname !== '/'

  return (
    <Layout className={styles.layout} style={{ height: '100vh' }}>
      {/* 悬浮返回按钮 */}
      {showBackButton && (
        <div className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </div>
      )}
      <div className={styles.content}>
        <Outlet />
      </div>
    </Layout>
  )
}

export default LayoutBody
