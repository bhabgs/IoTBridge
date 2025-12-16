import { useEffect, useCallback } from 'react'
import { Form, Typography, Divider, Button } from 'antd'
import { DeleteOutlined, GlobalOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useEditor } from '../../context/EditorContext'
import {
  getNodePropertyConfig,
  getValueByPath,
  setValueByPath,
  type PropertyField
} from '../../config/nodeProperties'
import { getScenePropertyConfig } from '../../config/sceneProperties'
import { DynamicPropertyEditor } from './DynamicPropertyEditor'
import styles from './index.module.less'

const { Title, Text } = Typography

const PropertySettings = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const {
    selectedNodeId,
    getSelectedNode,
    updateNode,
    deleteNode,
    currentMode,
    getSceneModel,
    updateSceneProperty,
    sceneVersion
  } = useEditor()

  const node = getSelectedNode()
  const config = node ? getNodePropertyConfig(node.type) : null
  const sceneConfig = getScenePropertyConfig(currentMode)

  // 当选中节点变化时，更新表单
  useEffect(() => {
    if (node && config) {
      // 节点属性模式
      const formValues: Record<string, any> = {}

      config.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.dataPath) {
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
      // 场景属性模式 - 从 sceneModel 加载值
      const sceneModel = getSceneModel()
      if (sceneModel && sceneConfig) {
        const formValues: Record<string, any> = {}

        sceneConfig.sections.forEach((section) => {
          section.fields.forEach((field) => {
            if (field.dataPath) {
              const value = getValueByPath(sceneModel, field.dataPath)
              formValues[field.key] = value !== undefined ? value : field.defaultValue
            }
          })
        })

        form.setFieldsValue(formValues)
      }
    }
  }, [selectedNodeId, getSelectedNode, form, sceneVersion, getSceneModel, sceneConfig, node, config])

  // 处理节点属性变化
  const handleNodeValuesChange = useCallback(
    (changedValues: any) => {
      if (!selectedNodeId || !node || !config) return

      const updates: any = {}

      Object.keys(changedValues).forEach((key) => {
        const value = changedValues[key]

        let fieldConfig: PropertyField | undefined = undefined
        for (const section of config.sections) {
          const found = section.fields.find((f) => f.key === key)
          if (found) {
            fieldConfig = found
            break
          }
        }

        if (!fieldConfig || !fieldConfig.dataPath) return

        let finalValue = value
        if (fieldConfig.type === 'color') {
          finalValue =
            typeof value === 'string' ? value : value?.toHexString?.() || fieldConfig.defaultValue
        }

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
    [selectedNodeId, node, config, updateNode]
  )

  // 处理场景属性变化
  const handleSceneValuesChange = useCallback(
    (changedValues: any) => {
      if (!sceneConfig) return

      Object.keys(changedValues).forEach((key) => {
        const value = changedValues[key]

        let fieldConfig: PropertyField | undefined = undefined
        for (const section of sceneConfig.sections) {
          const found = section.fields.find((f) => f.key === key)
          if (found) {
            fieldConfig = found
            break
          }
        }

        if (!fieldConfig || !fieldConfig.dataPath) return

        let finalValue = value
        if (fieldConfig.type === 'color') {
          finalValue =
            typeof value === 'string' ? value : value?.toHexString?.() || fieldConfig.defaultValue
        }

        updateSceneProperty(fieldConfig.dataPath, finalValue)
      })
    },
    [sceneConfig, updateSceneProperty]
  )

  // 删除节点
  const handleDelete = useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId)
    }
  }, [selectedNodeId, deleteNode])

  // 渲染属性区段
  const renderSections = (sections: typeof config.sections, isScene: boolean) => {
    return sections.map((section, sectionIndex) => (
      <div key={sectionIndex}>
        <div className={styles.sectionTitle}>
          <Text type="secondary">{section.title}</Text>
        </div>

        {/* 位置和尺寸字段特殊布局 */}
        {(section.title === '位置和尺寸' || section.title === '位置') && !isScene ? (
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

            <div className={styles.fieldGroup}>
              {section.fields
                .filter((f) =>
                  ['width', 'height', 'depth', 'radius', 'radiusX', 'radiusY'].includes(f.key)
                )
                .map((field) => (
                  <div key={field.key}>
                    <DynamicPropertyEditor field={field} currentMode={currentMode} />
                  </div>
                ))}
            </div>

            {section.fields
              .filter((f) => f.key === 'rotation')
              .map((field) => (
                <DynamicPropertyEditor key={field.key} field={field} currentMode={currentMode} />
              ))}
          </>
        ) : section.title === '相机' ? (
          // 相机位置字段横向排列
          <>
            <div className={styles.fieldGroup}>
              {section.fields
                .filter((f) =>
                  ['cameraPositionX', 'cameraPositionY', 'cameraPositionZ'].includes(f.key)
                )
                .map((field) => (
                  <div key={field.key}>
                    <DynamicPropertyEditor field={field} currentMode={currentMode} />
                  </div>
                ))}
            </div>
            {section.fields
              .filter((f) => f.key === 'cameraFov')
              .map((field) => (
                <DynamicPropertyEditor key={field.key} field={field} currentMode={currentMode} />
              ))}
          </>
        ) : (
          // 普通字段渲染
          section.fields.map((field) => (
            <DynamicPropertyEditor key={field.key} field={field} currentMode={currentMode} />
          ))
        )}

        {sectionIndex < sections.length - 1 && <Divider style={{ margin: '12px 0' }} />}
      </div>
    ))
  }

  return (
    <div className={`${styles.propertySettings} ${className || ''}`}>
      <div className={styles.propertyHeader}>
        <Title level={5} className={styles.propertyTitle}>
          {node ? t('editor.properties') : `${currentMode} 场景设置`}
        </Title>
        {!node && <GlobalOutlined style={{ marginLeft: 8, color: '#1890ff' }} />}
      </div>
      <Divider style={{ margin: '0' }} />
      <div className={styles.propertyContent}>
        {node && config ? (
          // 节点属性编辑
          <Form form={form} layout="vertical" size="small" onValuesChange={handleNodeValuesChange}>
            {renderSections(config.sections, false)}

            <Divider style={{ margin: '12px 0' }} />

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
          // 场景属性编辑
          <Form form={form} layout="vertical" size="small" onValuesChange={handleSceneValuesChange}>
            {renderSections(sceneConfig.sections, true)}
          </Form>
        )}
      </div>
    </div>
  )
}

export default PropertySettings
