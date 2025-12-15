/**
 * @fileoverview 组属性配置
 */

import type { NodePropertyConfig } from '../propertyTypes'
import { basicSection, position3DFields, rotationField } from '../sharedFields'

export const groupConfig: NodePropertyConfig = {
  nodeType: 'group',
  displayName: '组',
  sections: [
    basicSection,
    {
      title: '位置',
      fields: [...position3DFields, rotationField]
    }
  ]
}
