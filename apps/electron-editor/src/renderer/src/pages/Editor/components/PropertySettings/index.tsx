import { Form, Input, InputNumber, Typography, Divider } from 'antd'
import { useTranslation } from 'react-i18next'
import styles from './index.module.less'

const { Title } = Typography

const PropertySettings = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()

  return (
    <div className={`${styles.propertySettings} ${className || ''}`}>
      <div className={styles.propertyHeader}>
        <Title level={5} className={styles.propertyTitle}>
          {t('editor.properties')}
        </Title>
      </div>
      <Divider style={{ margin: '12px 0' }} />
      <div className={styles.propertyContent}>
        <Form form={form} layout="vertical" size="small">
          <Form.Item label="X" name="x">
            <InputNumber style={{ width: '100%' }} placeholder="X 坐标" controls={false} />
          </Form.Item>
          <Form.Item label="Y" name="y">
            <InputNumber style={{ width: '100%' }} placeholder="Y 坐标" controls={false} />
          </Form.Item>
          <Form.Item label="宽度" name="width">
            <InputNumber style={{ width: '100%' }} placeholder="宽度" controls={false} />
          </Form.Item>
          <Form.Item label="高度" name="height">
            <InputNumber style={{ width: '100%' }} placeholder="高度" controls={false} />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item label="文本内容" name="text">
            <Input.TextArea placeholder="请输入文本内容" rows={3} showCount maxLength={200} />
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default PropertySettings
