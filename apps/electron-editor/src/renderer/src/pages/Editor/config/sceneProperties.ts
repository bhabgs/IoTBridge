/**
 * @fileoverview 场景全局属性配置 - 2D/3D 模式下的场景级别设置
 */

import type { PropertySection } from './propertyTypes'

/**
 * 场景属性配置
 */
export interface ScenePropertyConfig {
  /** 显示名称 */
  displayName: string
  /** 属性分组 */
  sections: PropertySection[]
}

/**
 * 2D 场景属性配置
 */
export const scene2DConfig: ScenePropertyConfig = {
  displayName: '2D 场景设置',
  sections: [
    {
      title: '画布',
      fields: [
        {
          key: 'backgroundColor',
          label: '背景颜色',
          type: 'color',
          defaultValue: '#f5f5f5',
          dataPath: 'environment.background'
        },
        {
          key: 'canvasWidth',
          label: '画布宽度',
          type: 'number',
          defaultValue: 1920,
          min: 100,
          max: 10000,
          dataPath: 'meta.canvasWidth'
        },
        {
          key: 'canvasHeight',
          label: '画布高度',
          type: 'number',
          defaultValue: 1080,
          min: 100,
          max: 10000,
          dataPath: 'meta.canvasHeight'
        }
      ]
    },
    {
      title: '网格',
      fields: [
        {
          key: 'showGrid',
          label: '显示网格',
          type: 'boolean',
          defaultValue: true,
          dataPath: 'meta.showGrid'
        },
        {
          key: 'gridSize',
          label: '网格大小',
          type: 'number',
          defaultValue: 20,
          min: 5,
          max: 100,
          dataPath: 'meta.gridSize'
        }
      ]
    }
  ]
}

/**
 * 3D 场景属性配置
 */
export const scene3DConfig: ScenePropertyConfig = {
  displayName: '3D 场景设置',
  sections: [
    {
      title: '环境',
      fields: [
        {
          key: 'backgroundColor',
          label: '背景颜色',
          type: 'color',
          defaultValue: '#1a1a2e',
          dataPath: 'environment.background'
        },
        {
          key: 'ambientIntensity',
          label: '环境光强度',
          type: 'slider',
          defaultValue: 0.5,
          min: 0,
          max: 2,
          step: 0.1,
          dataPath: 'environment.ambientIntensity'
        }
      ]
    },
    {
      title: '相机',
      fields: [
        {
          key: 'cameraPositionX',
          label: '位置 X',
          type: 'number',
          defaultValue: 500,
          dataPath: 'camera.position.x'
        },
        {
          key: 'cameraPositionY',
          label: '位置 Y',
          type: 'number',
          defaultValue: 500,
          dataPath: 'camera.position.y'
        },
        {
          key: 'cameraPositionZ',
          label: '位置 Z',
          type: 'number',
          defaultValue: 500,
          dataPath: 'camera.position.z'
        },
        {
          key: 'cameraFov',
          label: '视场角 (FOV)',
          type: 'slider',
          defaultValue: 50,
          min: 10,
          max: 120,
          step: 1,
          dataPath: 'camera.fov'
        }
      ]
    },
    {
      title: '地面',
      fields: [
        {
          key: 'showGround',
          label: '显示地面',
          type: 'boolean',
          defaultValue: true,
          dataPath: 'meta.showGround'
        },
        {
          key: 'groundColor',
          label: '地面颜色',
          type: 'color',
          defaultValue: '#2d2d3d',
          dataPath: 'meta.groundColor'
        },
        {
          key: 'showGridHelper',
          label: '显示网格辅助',
          type: 'boolean',
          defaultValue: true,
          dataPath: 'meta.showGridHelper'
        }
      ]
    },
    {
      title: '雾效',
      fields: [
        {
          key: 'enableFog',
          label: '启用雾效',
          type: 'boolean',
          defaultValue: false,
          dataPath: 'environment.fog.enabled'
        },
        {
          key: 'fogColor',
          label: '雾颜色',
          type: 'color',
          defaultValue: '#cccccc',
          dataPath: 'environment.fog.color'
        },
        {
          key: 'fogNear',
          label: '近距离',
          type: 'number',
          defaultValue: 100,
          min: 0,
          dataPath: 'environment.fog.near'
        },
        {
          key: 'fogFar',
          label: '远距离',
          type: 'number',
          defaultValue: 1000,
          min: 0,
          dataPath: 'environment.fog.far'
        }
      ]
    }
  ]
}

/**
 * 根据模式获取场景属性配置
 */
export function getScenePropertyConfig(mode: '2D' | '3D'): ScenePropertyConfig {
  return mode === '2D' ? scene2DConfig : scene3DConfig
}
