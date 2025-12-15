/**
 * @fileoverview 圆形属性配置
 */

import type { NodePropertyConfig } from '../propertyTypes'
import { basicSection, position3DFields, rotationField, appearanceSection } from '../sharedFields'

export const circleConfig: NodePropertyConfig = {
  nodeType: 'circle',
  displayName: '圆形',
  sections: [
    basicSection,
    {
      title: '位置和尺寸',
      fields: [
        ...position3DFields,
        {
          key: 'radius',
          label: '半径',
          type: 'number',
          defaultValue: 50,
          min: 1,
          dataPath: 'geometry.radius'
        },
        rotationField
      ]
    },
    appearanceSection
  ]
}
