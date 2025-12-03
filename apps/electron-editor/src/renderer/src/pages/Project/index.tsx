import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { Button, Typography, Popconfirm, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import styles from './detail.module.less'

const { Title, Text } = Typography

interface ProcessFlow {
  id: number
  name: string
  description: string
  updatedAt: string
  thumbnail?: string
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [processFlows, setProcessFlows] = useState<ProcessFlow[]>(
    Array.from({ length: 12 }).map((_, index) => ({
      id: index + 1,
      name: `工艺流程图 ${index + 1}`,
      description: '这是一个工艺流程图的描述信息',
      updatedAt: '2024-12-02',
      thumbnail: undefined
    }))
  )

  const handleCreate = () => {}

  const handleDelete = (flowId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setProcessFlows((prev) => prev.filter((f) => f.id !== flowId))
    message.success('删除成功')
  }

  return (
    <div className={styles.processFlowList}>
      <div className={styles.header}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            工艺流程图列表
          </Title>
          <Text type="secondary">项目 ID: {id}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreate}>
          新建工艺流程图
        </Button>
      </div>

      <div className={styles.grid}>
        {processFlows.map((flow) => (
          <div key={flow.id} className={styles.flowCard} onClick={() => {}}>
            <div className={styles.cardThumbnail}>
              {flow.thumbnail ? (
                <img src={flow.thumbnail} alt={flow.name} />
              ) : (
                <div className={styles.thumbnailPlaceholder}>
                  <FileTextOutlined
                    style={{ fontSize: 48, color: 'var(--ant-color-text-secondary)' }}
                  />
                </div>
              )}
              <div className={styles.cardOverlay}>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.electronAPI.openWindow({ path: `/#/editor/${id}` })
                  }}
                >
                  编辑
                </Button>
                <Button
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.electronAPI.openWindow({ path: `/#/preview/${id}` })
                  }}
                >
                  预览
                </Button>
              </div>
            </div>
            <div className={styles.cardContent}>
              <Title level={5} className={styles.flowName}>
                {flow.name}
              </Title>
              <Text type="secondary" className={styles.flowDescription}>
                {flow.description}
              </Text>
              <div className={styles.cardFooter}>
                <Text type="secondary" className={styles.flowMeta}>
                  更新于 {flow.updatedAt}
                </Text>
                <Popconfirm
                  title="确定要删除这个工艺流程图吗？"
                  onConfirm={(e) => handleDelete(flow.id, e)}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
