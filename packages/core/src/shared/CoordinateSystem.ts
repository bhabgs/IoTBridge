/**
 * @fileoverview 坐标系统转换工具
 *
 * 统一 2D 和 3D 之间的坐标映射：
 * - 2D 是俯视图，对应 3D 的 XZ 平面
 * - 2D X 轴 → 3D X 轴
 * - 2D Y 轴 → 3D Z 轴
 * - 3D Y 轴是高度，2D 中不可见
 */

import type { Vec2, Vec3, NodeTransform } from '../types';

/**
 * 坐标系统转换器
 */
export class CoordinateSystem {
  /**
   * 3D 到世界单位的比例（100px = 1 世界单位）
   */
  static readonly SCALE_3D = 0.01;

  /**
   * 将 3D 位置转换为 2D 位置（俯视图）
   * @param position 3D 位置 (x, y, z)
   * @returns 2D 位置 (x, y)
   */
  static position3Dto2D(position: Vec3): Vec2 {
    return {
      x: position.x,
      y: position.z,  // 3D 的 Z 轴映射到 2D 的 Y 轴
    };
  }

  /**
   * 将 2D 位置转换为 3D 位置（俯视图）
   * @param position 2D 位置 (x, y)
   * @param height 3D 高度（Y 轴值），默认 0
   * @returns 3D 位置 (x, y, z)
   */
  static position2Dto3D(position: Vec2, height: number = 0): Vec3 {
    return {
      x: position.x,
      y: height,
      z: position.y,  // 2D 的 Y 轴映射到 3D 的 Z 轴
    };
  }

  /**
   * 将 3D 旋转转换为 2D 旋转（度）
   * 2D 只使用 3D 的 Y 轴旋转
   * @param rotation 3D 旋转 (x, y, z) 角度
   * @returns 2D 旋转角度
   */
  static rotation3Dto2D(rotation: Vec3): number {
    return rotation.y ?? 0;
  }

  /**
   * 将 2D 旋转转换为 3D 旋转（度）
   * @param rotation 2D 旋转角度
   * @returns 3D 旋转 (x, y, z) 角度
   */
  static rotation2Dto3D(rotation: number): Vec3 {
    return {
      x: 0,
      y: rotation,
      z: 0,
    };
  }

  /**
   * 将 3D 缩放转换为 2D 缩放
   * @param scale 3D 缩放 (x, y, z)
   * @returns 2D 缩放 (x, y)
   */
  static scale3Dto2D(scale: Vec3): Vec2 {
    return {
      x: scale.x,
      y: scale.z,  // 3D 的 Z 轴缩放映射到 2D 的 Y 轴缩放
    };
  }

  /**
   * 将 2D 缩放转换为 3D 缩放
   * @param scale 2D 缩放 (x, y)
   * @param scaleY 3D Y 轴缩放，默认 1
   * @returns 3D 缩放 (x, y, z)
   */
  static scale2Dto3D(scale: Vec2, scaleY: number = 1): Vec3 {
    return {
      x: scale.x,
      y: scaleY,
      z: scale.y,  // 2D 的 Y 轴缩放映射到 3D 的 Z 轴缩放
    };
  }

  /**
   * 将像素值转换为 3D 世界单位
   */
  static pixelToWorld(px: number): number {
    return px * this.SCALE_3D;
  }

  /**
   * 将 3D 世界单位转换为像素值
   */
  static worldToPixel(world: number): number {
    return world / this.SCALE_3D;
  }

  /**
   * 角度转弧度
   */
  static degToRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * 弧度转角度
   */
  static radToDeg(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  /**
   * 将完整的 NodeTransform 从 3D 转换为 2D 表示
   */
  static transform3Dto2D(transform: NodeTransform): {
    position: Vec2;
    rotation: number;
    scale: Vec2;
  } {
    return {
      position: this.position3Dto2D(transform.position),
      rotation: this.rotation3Dto2D(transform.rotation ?? { x: 0, y: 0, z: 0 }),
      scale: this.scale3Dto2D(transform.scale ?? { x: 1, y: 1, z: 1 }),
    };
  }

  /**
   * 将 2D 变换转换为 NodeTransform（保留原始 3D 数据）
   */
  static transform2Dto3D(
    transform2D: { position: Vec2; rotation: number; scale: Vec2 },
    original: NodeTransform
  ): NodeTransform {
    return {
      ...original,
      position: this.position2Dto3D(transform2D.position, original.position.y),
      rotation: this.rotation2Dto3D(transform2D.rotation),
      scale: this.scale2Dto3D(transform2D.scale, original.scale?.y ?? 1),
    };
  }
}
