import { Modal, Form, Input, message } from 'antd'
import { useEffect } from 'react'

export interface ProjectData {
  id: number
  name: string
  description: string
  updatedAt: string
}

interface EditModalProps {
  open: boolean
  project: ProjectData | null
  onCancel: () => void
  onOk: (values: Omit<ProjectData, 'id' | 'updatedAt'>) => void
}

export default function EditModal({ open, project, onCancel, onOk }: EditModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open && project) {
      form.setFieldsValue({
        name: project.name,
        description: project.description
      })
    } else {
      form.resetFields()
    }
  }, [open, project, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onOk(values)
      message.success('项目信息已更新')
      form.resetFields()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="编辑项目"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="保存"
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          label="项目名称"
          name="name"
          rules={[
            { required: true, message: '请输入项目名称' },
            { max: 50, message: '项目名称不能超过50个字符' }
          ]}
        >
          <Input placeholder="请输入项目名称" />
        </Form.Item>

        <Form.Item
          label="项目描述"
          name="description"
          rules={[
            { max: 200, message: '项目描述不能超过200个字符' }
          ]}
        >
          <Input.TextArea
            placeholder="请输入项目描述"
            rows={4}
            showCount
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

