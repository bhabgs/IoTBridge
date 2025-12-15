/**
 * @fileoverview 折线属性配置
 */

import type { NodePropertyConfig } from '../propertyTypes'
import { basicSection, position3DFields, strokeFields } from '../sharedFields'

export const polylineConfig: NodePropertyConfig = {
  nodeType: 'polyline',
  displayName: '折线',
  sections: [
    basicSection,
    {
      title: '位置',
      fields: position3DFields
    },
    {
      title: '外观',
      fields: strokeFields
    }
  ]
}
