export default {
  id: '1',
  version: '1.0.0',
  sceneMode: '3d',
  nodes: [
    // 两个矩形
    {
      id: '1',
      type: 'rect',
      transform: {
        position: { x: 0, y: 50, z: 0 }
      },
      geometry: {
        width: 100,
        height: 100,
        depth: 100
      },
      material: {
        color: 'yellow'
      }
    },
    {
      id: '2',
      type: 'rect',
      transform: {
        position: { x: 150, y: 50, z: 0 }
      },
      geometry: {
        width: 100,
        height: 100,
        depth: 100
      },
      material: {
        color: 'green'
      }
    }
  ],
  assets: {},
  symbols: [],
  meta: {}
}
