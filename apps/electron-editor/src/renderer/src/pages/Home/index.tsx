import { Card, Col, Row, Statistic, Button, Space, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FolderOutlined,
  FileAddOutlined,
  EditOutlined,
  ClockCircleOutlined,
  ProjectOutlined
} from '@ant-design/icons'
import styles from './index.module.less'

const { Title, Paragraph } = Typography

export default function Home() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // 模拟统计数据
  const stats = {
    totalProjects: 12,
    recentProjects: 5,
    totalElements: 156,
    lastModified: '2024-12-02'
  }

  // 最近项目数据
  const recentProjects = [
    { id: 1, name: '项目 A', modified: '2 小时前' },
    { id: 2, name: '项目 B', modified: '1 天前' },
    { id: 3, name: '项目 C', modified: '3 天前' }
  ]

  return (
    <div className={styles.container}>
      {/* 欢迎区域 */}
      <Card className={styles.welcomeCard}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              {t('home.welcome')}
            </Title>
            <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              {t('home.subtitle')}
            </Paragraph>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<FileAddOutlined />}
                onClick={() => navigate('/project')}
              >
                {t('home.createProject')}
              </Button>
              <Button size="large" icon={<FolderOutlined />} onClick={() => navigate('/project')}>
                {t('home.manageProjects')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计信息 */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('home.totalProjects')}
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('home.recentProjects')}
              value={stats.recentProjects}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('home.totalElements')}
              value={stats.totalElements}
              prefix={<EditOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('home.lastModified')}
              value={stats.lastModified}
              valueStyle={{ fontSize: 16, color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作和最近项目 */}
      <Row gutter={[16, 16]}>
        {/* 快速操作 */}
        <Col xs={24} lg={8}>
          <Card title={t('home.quickActions')} className={styles.actionCard}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button
                block
                size="large"
                icon={<FileAddOutlined />}
                onClick={() => navigate('/project')}
              >
                {t('home.createNewProject')}
              </Button>
              <Button
                block
                size="large"
                icon={<FolderOutlined />}
                onClick={() => navigate('/project')}
              >
                {t('home.openProject')}
              </Button>
              <Button
                block
                size="large"
                icon={<EditOutlined />}
                onClick={() => navigate('/settings')}
              >
                {t('common.settings')}
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 最近项目 */}
        <Col xs={24} lg={16}>
          <Card
            title={t('home.recentProjects')}
            extra={
              <Button type="link" onClick={() => navigate('/project')}>
                {t('home.viewAll')}
              </Button>
            }
            className={styles.recentCard}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {recentProjects.map((project) => (
                <Card
                  key={project.id}
                  hoverable
                  size="small"
                  onClick={() => navigate(`/editor/${project.id}`)}
                  className={styles.projectItem}
                >
                  <Row align="middle" justify="space-between">
                    <Col flex={1}>
                      <Title level={5} style={{ margin: 0 }}>
                        {project.name}
                      </Title>
                      <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
                        <ClockCircleOutlined /> {project.modified}
                      </Paragraph>
                    </Col>
                    <Col>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/editor/${project.id}`)
                        }}
                      >
                        {t('common.edit')}
                      </Button>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
