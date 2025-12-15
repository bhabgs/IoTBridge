/**
 * @fileoverview 多边形属性配置
 */

import type { NodePropertyConfig } from '../propertyTypes'
import { basicSection, position3DFields, rotationField, fillStrokeFields } from '../sharedFields'

export const polygonConfig: NodePropertyConfig = {
  nodeType: 'polygon',
  displayName: '多边形',
  sections: [
    basicSection,
    {
      title: '位置',
      fields: [...position3DFields, rotationField]
    },
    {
      title: '外观',
      fields: fillStrokeFields
    }
  ]
}
