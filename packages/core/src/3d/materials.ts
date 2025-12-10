import {
  Color,
  DoubleSide,
  FrontSide,
  BackSide,
  Side,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshPhongMaterial,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
} from "three";
import { SceneNode } from "../types";

export type MaterialType =
  | MeshBasicMaterial
  | MeshStandardMaterial
  | MeshPhongMaterial
  | MeshLambertMaterial
  | MeshPhysicalMaterial;

/**
 * 解析颜色值
 */
export function parseColor(colorValue: any): Color {
  if (!colorValue) return new Color(0xcccccc);

  // 如果是渐变，取第一个颜色
  if (typeof colorValue === "object" && colorValue.stops) {
    return new Color(colorValue.stops[0]?.color || 0xcccccc);
  }

  return new Color(colorValue);
}

/**
 * 根据节点配置创建材质
 */
export function createMaterial(node: SceneNode): MaterialType {
  const nodeMaterial = node.material;
  const nodeStyle = node.style;

  // 获取颜色
  const color = parseColor(nodeStyle?.fill || nodeMaterial?.color || "#cccccc");

  // 获取透明度
  const opacity = nodeStyle?.opacity ?? nodeMaterial?.opacity ?? 1;
  const transparent = opacity < 1 || nodeMaterial?.transparent === true;

  // 获取渲染面
  let side: Side = FrontSide;
  if (nodeMaterial?.side === "back") side = BackSide;
  if (nodeMaterial?.side === "double") side = DoubleSide;

  const materialType = nodeMaterial?.type || "basic";

  const baseOptions = {
    color,
    opacity,
    transparent,
    side,
    wireframe: nodeMaterial?.wireframe ?? false,
  };

  switch (materialType) {
    case "standard":
      return new MeshStandardMaterial({
        ...baseOptions,
        metalness: nodeMaterial?.metalness ?? 0,
        roughness: nodeMaterial?.roughness ?? 0.5,
        flatShading: nodeMaterial?.flatShading ?? false,
      });
    case "physical":
      return new MeshPhysicalMaterial({
        ...baseOptions,
        metalness: nodeMaterial?.metalness ?? 0,
        roughness: nodeMaterial?.roughness ?? 0.5,
        flatShading: nodeMaterial?.flatShading ?? false,
      });
    case "phong":
      return new MeshPhongMaterial({
        ...baseOptions,
        flatShading: nodeMaterial?.flatShading ?? false,
      });
    case "lambert":
      return new MeshLambertMaterial(baseOptions);
    case "basic":
    default:
      return new MeshBasicMaterial(baseOptions);
  }
}

