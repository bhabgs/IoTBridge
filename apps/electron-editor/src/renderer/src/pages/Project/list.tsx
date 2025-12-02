import { EditOutlined, SettingOutlined } from '@ant-design/icons'
import { Card, Col, Row } from 'antd'
import { useNavigate } from 'react-router-dom'
import styles from './index.module.less'

export default function ProjectList() {
  const navigate = useNavigate()

  // 创建 actions，每个项目都有独立的点击事件
  const createActions = (projectId: number | string) => [
    <EditOutlined
      key="edit"
      onClick={() => {
        // 打开一个新的编辑器窗口
        // window.electronAPI.openNewWindow(`/#/project/${projectId}`)
        navigate(`/project/${projectId}`)
      }}
    />,
    <SettingOutlined
      key="setting"
      onClick={() => {
        console.log('设置项目:', projectId)
      }}
    />
  ]

  return (
    <Row gutter={16}>
      {Array.from({ length: 10 }).map((_, index) => (
        <Col span={8} key={index} className={styles.card}>
          <Card actions={createActions(index + 1)}>
            <Card.Meta
              title="项目名称"
              description={
                <>
                  <p>项目描述</p>
                  <p>项目描述</p>
                </>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  )
}
