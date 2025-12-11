import type { SceneModel } from 'core'

const data: SceneModel = {
  id: '1',
  version: '1.0.0',
  sceneMode: '2d',
  nodes: [
    // 初始两个矩形
    {
      id: 'rect-1',
      type: 'rect',
      name: '矩形1',
      transform: {
        position: { x: 100, y: 0, z: 100 }
      },
      geometry: {
        width: 100,  // X 轴尺寸
        height: 100, // Y 轴尺寸（3D高度）
        depth: 100   // Z 轴尺寸（2D高度）
      },
      material: {
        color: '#4A90D9'
      }
    },
    {
      id: 'rect-2',
      type: 'rect',
      name: '矩形2',
      transform: {
        position: { x: 250, y: 0, z: 100 }
      },
      geometry: {
        width: 80,
        height: 80,
        depth: 80
      },
      material: {
        color: '#67C23A'
      }
    }
  ],
  assets: {},
  symbols: [],
  meta: {}
}

export default data
