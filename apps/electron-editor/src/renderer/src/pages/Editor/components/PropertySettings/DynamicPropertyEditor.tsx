import { Form, Input, InputNumber, ColorPicker, Select, Switch, Slider } from 'antd'
import type { PropertyField } from '../../config/nodeProperties'

interface DynamicPropertyEditorProps {
  field: PropertyField
  currentMode: '2D' | '3D'
}

/**
 * 动态属性编辑器 - 根据字段配置渲染不同的表单控件
 */
export const DynamicPropertyEditor = ({ field, currentMode }: DynamicPropertyEditorProps) => {
  // 检查字段是否应该在当前模式下显示
  const shouldShow = () => {
    if (currentMode === '2D' && field.show3D === true && field.show2D !== true) {
      return false
    }
    if (currentMode === '3D' && field.show2D === true && field.show3D !== true) {
      return false
    }
    return true
  }

  if (!shouldShow()) {
    return null
  }

  // 根据字段类型渲染不同的控件
  const renderControl = () => {
    switch (field.type) {
      case 'string':
        // 如果是类型字段，禁用编辑
        if (field.key === 'type') {
          return <Input disabled placeholder={field.placeholder} />
        }
        return <Input placeholder={field.placeholder} />

      case 'number':
        return (
          <InputNumber
            style={{ width: '100%' }}
            min={field.min}
            max={field.max}
            step={field.step}
            controls={false}
          />
        )

      case 'color':
        return <ColorPicker format="hex" showText />

      case 'text':
        return <Input.TextArea placeholder={field.placeholder} rows={field.rows || 3} />

      case 'select':
        return (
          <Select placeholder={field.placeholder} options={field.options} />
        )

      case 'boolean':
        return <Switch />

      case 'slider':
        return (
          <Slider
            min={field.min}
            max={field.max}
            step={field.step}
          />
        )

      default:
        return <Input />
    }
  }

  return (
    <Form.Item
      label={field.label}
      name={field.key}
      valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
      rules={[
        {
          required: field.required,
          message: `请输入${field.label}`
        },
        field.validator
          ? {
              validator: (_, value) => {
                const result = field.validator!(value)
                if (result === true) {
                  return Promise.resolve()
                }
                return Promise.reject(
                  new Error(typeof result === 'string' ? result : `${field.label}格式不正确`)
                )
              }
            }
          : {}
      ]}
      help={field.helpText}
    >
      {renderControl()}
    </Form.Item>
  )
}
