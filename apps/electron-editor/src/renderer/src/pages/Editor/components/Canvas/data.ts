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
        width: 100,
        height: 100,
        depth: 10
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
        depth: 10
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
