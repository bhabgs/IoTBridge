/**
 * @fileoverview 线条属性配置
 */

import type { NodePropertyConfig } from '../propertyTypes'
import { basicSection, position3DFields, strokeFields } from '../sharedFields'

export const lineConfig: NodePropertyConfig = {
  nodeType: 'line',
  displayName: '线条',
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
