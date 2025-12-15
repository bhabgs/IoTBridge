/**
 * @fileoverview 矩形属性配置
 */

import type { NodePropertyConfig } from '../propertyTypes'
import { basicSection, position3DFields, rotationField, appearanceSection } from '../sharedFields'

export const rectConfig: NodePropertyConfig = {
  nodeType: 'rect',
  displayName: '矩形',
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
          dataPath: 'geometry.width',
          show2D: true
        },
        {
          key: 'depth',
          label: '高度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.depth',
          show2D: true
        },
        {
          key: 'width',
          label: '长度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.width',
          show3D: true
        },
        {
          key: 'depth',
          label: '宽度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.depth',
          show3D: true
        },
        {
          key: 'height',
          label: '高度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.height',
          show3D: true
        },
        rotationField
      ]
    },
    appearanceSection
  ]
}
