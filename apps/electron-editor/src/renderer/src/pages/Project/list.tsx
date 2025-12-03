import { EditOutlined, FileOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { ReactNode } from 'react'
import styles from './list.module.less'
import EditModal, { type ProjectData } from './EditModal'

const { Title, Text } = Typography

interface ProjectWithIcon extends ProjectData {
  icon: ReactNode
}

export default function ProjectList() {
  const navigate = useNavigate()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null)
  const [projects, setProjects] = useState<ProjectWithIcon[]>(
    Array.from({ length: 5 }).map((_, index) => ({
      id: index + 1,
      name: `项目名称 ${index + 1}`,
      description: '这是一个项目描述，可以包含项目的详细信息',
      updatedAt: '2024-12-02',
      icon: <FileOutlined />
    }))
  )

  const handleEdit = (project: ProjectWithIcon, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingProject({
      id: project.id,
      name: project.name,
      description: project.description,
      updatedAt: project.updatedAt
    })
    setEditModalOpen(true)
  }

  const handleEditOk = (values: Omit<ProjectData, 'id' | 'updatedAt'>) => {
    if (editingProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? {
                ...p,
                ...values,
                updatedAt: new Date().toISOString().split('T')[0]
              }
            : p
        )
      )
      setEditModalOpen(false)
      setEditingProject(null)
    }
  }

  const handleEditCancel = () => {
    setEditModalOpen(false)
    setEditingProject(null)
  }

  return (
    <div className={styles.projectList}>
      <div className={styles.header}>
        <Title level={2} style={{ margin: 0 }}>
          项目列表
        </Title>
      </div>

      <div className={styles.grid}>
        {projects.map((project) => (
          <div
            key={project.id}
            className={styles.projectCard}
            onClick={() => navigate(`/project/${project.id}`)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.projectIcon}>{project.icon}</div>
            </div>
            <div className={styles.cardContent}>
              <Title level={4} className={styles.projectName}>
                {project.name}
              </Title>
              <Text type="secondary" className={styles.projectDescription}>
                {project.description}
              </Text>
            </div>
            <div className={styles.cardFooter}>
              <Text type="secondary" className={styles.projectMeta}>
                更新于 {project.updatedAt}
              </Text>
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                onClick={(e) => handleEdit(project, e)}
              >
                编辑
              </Button>
            </div>
          </div>
        ))}
      </div>

      <EditModal
        open={editModalOpen}
        project={editingProject}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
      />
    </div>
  )
}
