import { useEffect, useCallback } from 'react'
import { Form, Input, InputNumber, Typography, Divider, ColorPicker, Empty, Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useEditor } from '../../context/EditorContext'
import styles from './index.module.less'

const { Title, Text } = Typography

const PropertySettings = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const { selectedNodeId, getSelectedNode, updateNode, deleteNode } = useEditor()

  // 当选中节点变化时，更新表单
  useEffect(() => {
    const node = getSelectedNode()
    if (node) {
      form.setFieldsValue({
        name: node.name || '',
        x: node.transform?.position?.x ?? 0,
        y: node.transform?.position?.z ?? 0, // 2D 中 y 对应 3D 的 z
        width: node.geometry?.width ?? 100,
        height: node.geometry?.height ?? 100,
        rotation: node.transform?.rotation?.y ?? 0,
        color: node.material?.color || node.style?.fill || '#4A90D9',
        text: node.style?.text || ''
      })
    } else {
      form.resetFields()
    }
  }, [selectedNodeId, getSelectedNode, form])

  // 处理表单值变化
  const handleValuesChange = useCallback(
    (changedValues: any) => {
      if (!selectedNodeId) return

      const node = getSelectedNode()
      if (!node) return

      const updates: any = {}

      // 处理位置变化
      if ('x' in changedValues || 'y' in changedValues) {
        updates.transform = {
          ...node.transform,
          position: {
            x: changedValues.x ?? node.transform?.position?.x ?? 0,
            y: node.transform?.position?.y ?? 0,
            z: changedValues.y ?? node.transform?.position?.z ?? 0
          }
        }
      }

      // 处理尺寸变化
      if ('width' in changedValues || 'height' in changedValues) {
        updates.geometry = {
          ...node.geometry,
          width: changedValues.width ?? node.geometry?.width ?? 100,
          height: changedValues.height ?? node.geometry?.height ?? 100
        }
      }

      // 处理旋转变化
      if ('rotation' in changedValues) {
        updates.transform = {
          ...node.transform,
          ...(updates.transform || {}),
          rotation: {
            x: 0,
            y: changedValues.rotation ?? 0,
            z: 0
          }
        }
      }

      // 处理颜色变化
      if ('color' in changedValues) {
        const colorValue =
          typeof changedValues.color === 'string'
            ? changedValues.color
            : changedValues.color?.toHexString?.() || '#4A90D9'

        if (node.material) {
          updates.material = {
            ...node.material,
            color: colorValue
          }
        }
        if (node.style) {
          updates.style = {
            ...node.style,
            fill: colorValue
          }
        }
      }

      // 处理名称变化
      if ('name' in changedValues) {
        updates.name = changedValues.name
      }

      // 处理文本变化
      if ('text' in changedValues) {
        updates.style = {
          ...node.style,
          ...(updates.style || {}),
          text: changedValues.text
        }
      }

      if (Object.keys(updates).length > 0) {
        updateNode(selectedNodeId, updates)
      }
    },
    [selectedNodeId, getSelectedNode, updateNode]
  )

  // 删除节点
  const handleDelete = useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId)
    }
  }, [selectedNodeId, deleteNode])

  const node = getSelectedNode()

  return (
    <div className={`${styles.propertySettings} ${className || ''}`}>
      <div className={styles.propertyHeader}>
        <Title level={5} className={styles.propertyTitle}>
          {t('editor.properties')}
        </Title>
      </div>
      <Divider style={{ margin: '0' }} />
      <div className={styles.propertyContent}>
        {node ? (
          <Form
            form={form}
            layout="vertical"
            size="small"
            onValuesChange={handleValuesChange}
          >
            {/* 基础信息 */}
            <div className={styles.sectionTitle}>
              <Text type="secondary">基础信息</Text>
            </div>
            <Form.Item label="名称" name="name">
              <Input placeholder="节点名称" />
            </Form.Item>
            <Form.Item label="类型">
              <Input value={node.type} disabled />
            </Form.Item>

            <Divider style={{ margin: '12px 0' }} />

            {/* 位置和尺寸 */}
            <div className={styles.sectionTitle}>
              <Text type="secondary">位置和尺寸</Text>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Form.Item label="X" name="x" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} controls={false} />
              </Form.Item>
              <Form.Item label="Y" name="y" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} controls={false} />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Form.Item label="宽度" name="width" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} min={1} controls={false} />
              </Form.Item>
              <Form.Item label="高度" name="height" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} min={1} controls={false} />
              </Form.Item>
            </div>
            <Form.Item label="旋转 (度)" name="rotation">
              <InputNumber
                style={{ width: '100%' }}
                min={-360}
                max={360}
                controls={false}
              />
            </Form.Item>

            <Divider style={{ margin: '12px 0' }} />

            {/* 外观 */}
            <div className={styles.sectionTitle}>
              <Text type="secondary">外观</Text>
            </div>
            <Form.Item label="颜色" name="color">
              <ColorPicker format="hex" />
            </Form.Item>

            {/* 文本 (仅文本类型显示) */}
            {node.type === 'text' && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div className={styles.sectionTitle}>
                  <Text type="secondary">文本</Text>
                </div>
                <Form.Item label="文本内容" name="text">
                  <Input.TextArea placeholder="请输入文本内容" rows={3} />
                </Form.Item>
              </>
            )}

            <Divider style={{ margin: '12px 0' }} />

            {/* 操作 */}
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              style={{ width: '100%' }}
            >
              删除节点
            </Button>
          </Form>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请选择一个节点"
            style={{ marginTop: 60 }}
          />
        )}
      </div>
    </div>
  )
}

export default PropertySettings
