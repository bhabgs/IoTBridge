import { useEffect, useCallback } from 'react'
import { Form, Typography, Divider, Empty, Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useEditor } from '../../context/EditorContext'
import {
  getNodePropertyConfig,
  getValueByPath,
  setValueByPath,
  type PropertyField
} from '../../config/nodeProperties'
import { DynamicPropertyEditor } from './DynamicPropertyEditor'
import styles from './index.module.less'

const { Title, Text } = Typography

const PropertySettings = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const { selectedNodeId, getSelectedNode, updateNode, deleteNode, currentMode } = useEditor()

  // 当选中节点变化时，更新表单
  useEffect(() => {
    const node = getSelectedNode()
    if (node) {
      const config = getNodePropertyConfig(node.type)
      if (!config) {
        form.resetFields()
        return
      }

      // 从配置中提取所有字段，并设置表单值
      const formValues: Record<string, any> = {}

      config.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.dataPath) {
            // 从节点数据中获取值
            const value = getValueByPath(node, field.dataPath)
            formValues[field.key] = value !== undefined ? value : field.defaultValue
          }
        })
      })

      // 特殊处理：2D 下的 Y 坐标对应 3D 的 Z
      if (formValues.y === undefined && node.transform?.position?.z !== undefined) {
        formValues.y = node.transform.position.z
      }

      form.setFieldsValue(formValues)
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

      const config = getNodePropertyConfig(node.type)
      if (!config) return

      // 构建更新对象
      const updates: any = {}

      // 遍历变化的字段，根据配置的 dataPath 设置值
      Object.keys(changedValues).forEach((key) => {
        const value = changedValues[key]

        // 查找对应的字段配置
        let fieldConfig: PropertyField | undefined = undefined
        for (const section of config.sections) {
          const found = section.fields.find((f) => f.key === key)
          if (found) {
            fieldConfig = found
            break
          }
        }

        if (!fieldConfig || !fieldConfig.dataPath) return

        // 特殊处理颜色值
        let finalValue = value
        if (fieldConfig.type === 'color') {
          finalValue =
            typeof value === 'string' ? value : value?.toHexString?.() || fieldConfig.defaultValue
        }

        // 使用 dataPath 设置嵌套值
        setValueByPath(updates, fieldConfig.dataPath, finalValue)

        // 特殊处理：如果更新了颜色，同时更新 material.color 和 style.fill
        if (fieldConfig.key === 'color') {
          if (node.material) {
            setValueByPath(updates, 'material.color', finalValue)
          }
          if (node.style) {
            setValueByPath(updates, 'style.fill', finalValue)
          }
        }
      })

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
  const config = node ? getNodePropertyConfig(node.type) : null

  return (
    <div className={`${styles.propertySettings} ${className || ''}`}>
      <div className={styles.propertyHeader}>
        <Title level={5} className={styles.propertyTitle}>
          {t('editor.properties')}
        </Title>
      </div>
      <Divider style={{ margin: '0' }} />
      <div className={styles.propertyContent}>
        {node && config ? (
          <Form form={form} layout="vertical" size="small" onValuesChange={handleValuesChange}>
            {config.sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* 分组标题 */}
                <div className={styles.sectionTitle}>
                  <Text type="secondary">{section.title}</Text>
                </div>

                {/* 渲染字段 */}
                {section.fields.map((field) => {
                  // 对于位置字段，使用特殊布局
                  if (
                    section.title === '位置和尺寸' ||
                    section.title === '位置' ||
                    section.title === '尺寸'
                  ) {
                    return null // 位置和尺寸字段在下面特殊处理
                  }

                  return (
                    <DynamicPropertyEditor
                      key={field.key}
                      field={field}
                      currentMode={currentMode}
                    />
                  )
                })}

                {/* 特殊布局：位置字段（横向排列） */}
                {(section.title === '位置和尺寸' || section.title === '位置') && (
                  <>
                    <div className={styles.fieldGroup}>
                      {section.fields
                        .filter((f) => ['x', 'y', 'z'].includes(f.key))
                        .map((field) => (
                          <div key={field.key}>
                            <DynamicPropertyEditor field={field} currentMode={currentMode} />
                          </div>
                        ))}
                    </div>

                    {/* 尺寸字段 */}
                    <div className={styles.fieldGroup}>
                      {section.fields
                        .filter((f) =>
                          ['width', 'height', 'depth', 'radius', 'radiusX', 'radiusY'].includes(
                            f.key
                          )
                        )
                        .map((field) => (
                          <div key={field.key}>
                            <DynamicPropertyEditor field={field} currentMode={currentMode} />
                          </div>
                        ))}
                    </div>

                    {/* 旋转字段 */}
                    {section.fields
                      .filter((f) => f.key === 'rotation')
                      .map((field) => (
                        <DynamicPropertyEditor
                          key={field.key}
                          field={field}
                          currentMode={currentMode}
                        />
                      ))}
                  </>
                )}

                {sectionIndex < config.sections.length - 1 && (
                  <Divider style={{ margin: '12px 0' }} />
                )}
              </div>
            ))}

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
