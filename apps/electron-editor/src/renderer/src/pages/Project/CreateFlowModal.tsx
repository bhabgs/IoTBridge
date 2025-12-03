import { Modal, Form, Input, message } from 'antd'

interface CreateFlowModalProps {
  open: boolean
  onCancel: () => void
  onOk: (values: { name: string; description: string }) => void
}

export default function CreateFlowModal({ open, onCancel, onOk }: CreateFlowModalProps) {
  const [form] = Form.useForm()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onOk(values)
      message.success('工艺流程图创建成功')
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
      title="新建工艺流程图"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="创建"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          label="流程图名称"
          name="name"
          rules={[
            { required: true, message: '请输入流程图名称' },
            { max: 50, message: '流程图名称不能超过50个字符' }
          ]}
        >
          <Input placeholder="请输入流程图名称" />
        </Form.Item>

        <Form.Item
          label="流程图描述"
          name="description"
          rules={[{ max: 200, message: '流程图描述不能超过200个字符' }]}
        >
          <Input.TextArea
            placeholder="请输入流程图描述"
            rows={4}
            showCount
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

