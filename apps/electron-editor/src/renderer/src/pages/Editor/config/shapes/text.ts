/**
 * @fileoverview 文本属性配置
 */

import type { NodePropertyConfig } from '../propertyTypes'
import { basicSection, position3DFields, rotationField } from '../sharedFields'

export const textConfig: NodePropertyConfig = {
  nodeType: 'text',
  displayName: '文本',
  sections: [
    basicSection,
    {
      title: '位置和尺寸',
      fields: [
        ...position3DFields,
        {
          key: 'width',
          label: '宽度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.width'
        },
        {
          key: 'height',
          label: '高度',
          type: 'number',
          defaultValue: 30,
          min: 1,
          dataPath: 'geometry.height'
        },
        rotationField
      ]
    },
    {
      title: '文本',
      fields: [
        {
          key: 'text',
          label: '文本内容',
          type: 'text',
          defaultValue: '文本',
          placeholder: '请输入文本内容',
          rows: 3,
          dataPath: 'style.text'
        },
        {
          key: 'fontSize',
          label: '字号',
          type: 'number',
          defaultValue: 16,
          min: 8,
          max: 72,
          dataPath: 'style.fontSize'
        }
      ]
    },
    {
      title: '外观',
      fields: [
        {
          key: 'fill',
          label: '颜色',
          type: 'color',
          defaultValue: '#303133',
          dataPath: 'style.fill'
        }
      ]
    }
  ]
}
