import {
  BoxGeometry,
  SphereGeometry,
  BufferGeometry,
  Mesh,
  Group,
  Object3D,
  Line,
  LineBasicMaterial,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { SceneNode } from "../types";
import { createMaterial, parseColor } from "./materials";

/** 像素到世界单位的转换比例：100px = 1 world unit */
const SCALE = 0.01;

/** 将像素值转换为世界单位 */
function toWorldUnit(px: number): number {
  return px * SCALE;
}

/**
 * 节点工厂 - 负责将 SceneNode 转换为 Three.js Object3D
 */
export class NodeFactory {
  /**
   * 根据节点类型创建对应的 3D 对象
   */
  createObject3D(node: SceneNode): Object3D | null {
    if (node.visible === false) return null;

    let object: Object3D | null = null;

    switch (node.type) {
      case "group":
        object = this.createGroup(node);
        break;
      case "rect":
        object = this.createRect(node);
        break;
      case "circle":
        object = this.createCircle(node);
        break;
      case "ellipse":
        object = this.createEllipse(node);
        break;
      case "line":
        object = this.createLine(node);
        break;
      case "polyline":
      case "polygon":
        object = this.createPolyline(node);
        break;
      default:
        return null;
    }

    if (object) {
      this.applyTransform(object, node);
      object.name = node.name || node.id;
      object.userData = { nodeId: node.id, metadata: node.metadata };

      if (node.opacity !== undefined) {
        object.traverse((child) => {
          if (child instanceof Mesh && child.material) {
            const mat = child.material as MeshBasicMaterial;
            mat.transparent = true;
            mat.opacity = node.opacity!;
          }
        });
      }
    }

    return object;
  }

  /**
   * 创建组
   */
  createGroup(node: SceneNode): Group {
    const group = new Group();

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childObject = this.createObject3D(child);
        if (childObject) {
          group.add(childObject);
        }
      }
    }

    return group;
  }

  /**
   * 创建矩形/立方体
   */
  createRect(node: SceneNode): Mesh {
    const geometry = node.geometry;
    const width = toWorldUnit(geometry?.width ?? 100);
    const height = toWorldUnit(geometry?.height ?? 100);
    const depth = toWorldUnit(geometry?.depth ?? 10);

    const color = parseColor(node.style?.fill || node.material?.color);
    const boxGeometry = new BoxGeometry(width, height, depth);
    const material = new MeshBasicMaterial({ color });

    return new Mesh(boxGeometry, material);
  }

  /**
   * 创建圆形/球体
   */
  createCircle(node: SceneNode): Mesh {
    const geometry = node.geometry;
    const radius = toWorldUnit(geometry?.radius ?? 50);

    const sphereGeometry = new SphereGeometry(radius, 32, 32);
    const material = createMaterial(node);

    return new Mesh(sphereGeometry, material);
  }

  /**
   * 创建椭圆/椭球体
   */
  createEllipse(node: SceneNode): Mesh {
    const geometry = node.geometry;
    const radiusX = toWorldUnit(geometry?.radiusX ?? geometry?.radius ?? 50);
    const radiusY = toWorldUnit(geometry?.radiusY ?? geometry?.radius ?? 50);

    const sphereGeometry = new SphereGeometry(1, 32, 32);
    const material = createMaterial(node);
    const mesh = new Mesh(sphereGeometry, material);
    mesh.scale.set(radiusX, radiusY, Math.min(radiusX, radiusY));

    return mesh;
  }

  /**
   * 创建线条
   */
  createLine(node: SceneNode): Line {
    const geometry = node.geometry;
    const points = geometry?.points || [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    const vertices = points.map(
      (p) => new Vector3(toWorldUnit(p.x), toWorldUnit(p.y), 0)
    );
    const lineGeometry = new BufferGeometry().setFromPoints(vertices);

    const color = parseColor(node.style?.stroke || node.material?.color);
    const lineMaterial = new LineBasicMaterial({ color });

    return new Line(lineGeometry, lineMaterial);
  }

  /**
   * 创建折线/多边形
   */
  createPolyline(node: SceneNode): Line {
    const geometry = node.geometry;
    const points = geometry?.points || [];

    if (points.length < 2) {
      return new Line();
    }

    const vertices = points.map(
      (p) => new Vector3(toWorldUnit(p.x), toWorldUnit(p.y), 0)
    );

    // 如果是闭合多边形，添加回到起点的点
    if (node.type === "polygon" || geometry?.closed) {
      vertices.push(vertices[0].clone());
    }

    const lineGeometry = new BufferGeometry().setFromPoints(vertices);
    const color = parseColor(node.style?.stroke || node.material?.color);
    const lineMaterial = new LineBasicMaterial({ color });

    return new Line(lineGeometry, lineMaterial);
  }

  /**
   * 应用变换
   */
  applyTransform(object: Object3D, node: SceneNode) {
    const transform = node.transform;
    if (!transform) return;

    // 设置位置（像素转世界单位）
    const pos = transform.position;
    object.position.set(
      toWorldUnit(pos.x),
      toWorldUnit(pos.y),
      toWorldUnit(pos.z)
    );

    // 设置旋转（角度转弧度）
    if (transform.rotation) {
      const rot = transform.rotation;
      object.rotation.set(
        (rot.x * Math.PI) / 180,
        (rot.y * Math.PI) / 180,
        (rot.z * Math.PI) / 180
      );
    }

    // 设置缩放（不需要转换，缩放是比例值）
    if (transform.scale) {
      const scale = transform.scale;
      object.scale.set(scale.x, scale.y, scale.z);
    }
  }
}

// 导出单例
export const nodeFactory = new NodeFactory();

