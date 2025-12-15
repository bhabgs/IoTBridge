/**
 * @fileoverview 椭圆属性配置
 */

import type { NodePropertyConfig } from '../propertyTypes'
import { basicSection, position3DFields, rotationField, appearanceSection } from '../sharedFields'

export const ellipseConfig: NodePropertyConfig = {
  nodeType: 'ellipse',
  displayName: '椭圆',
  sections: [
    basicSection,
    {
      title: '位置和尺寸',
      fields: [
        ...position3DFields,
        {
          key: 'radiusX',
          label: 'X 半径',
          type: 'number',
          defaultValue: 60,
          min: 1,
          dataPath: 'geometry.radiusX'
        },
        {
          key: 'radiusY',
          label: 'Y 半径',
          type: 'number',
          defaultValue: 40,
          min: 1,
          dataPath: 'geometry.radiusY'
        },
        rotationField
      ]
    },
    appearanceSection
  ]
}
