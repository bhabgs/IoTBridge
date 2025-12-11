import {
  Graphics,
  Container,
  Text,
  TextStyle,
  Sprite,
  Texture,
  ColorSource,
} from "pixi.js";
import { SceneNode } from "../types";

/**
 * 解析颜色值为 PixiJS 可用的颜色
 */
export function parseColor(colorValue: any): ColorSource {
  if (!colorValue) return 0xcccccc;

  // 如果是渐变，取第一个颜色
  if (typeof colorValue === "object" && colorValue.stops) {
    return colorValue.stops[0]?.color || 0xcccccc;
  }

  // 如果是字符串颜色名称
  if (typeof colorValue === "string") {
    // 处理常见颜色名称
    const colorMap: Record<string, number> = {
      red: 0xff0000,
      green: 0x00ff00,
      blue: 0x0000ff,
      yellow: 0xffff00,
      cyan: 0x00ffff,
      magenta: 0xff00ff,
      white: 0xffffff,
      black: 0x000000,
      orange: 0xffa500,
      purple: 0x800080,
      pink: 0xffc0cb,
      gray: 0x808080,
      grey: 0x808080,
    };

    const lowerColor = colorValue.toLowerCase();
    if (colorMap[lowerColor] !== undefined) {
      return colorMap[lowerColor];
    }

    // 处理十六进制颜色 (#RRGGBB 或 #RGB)
    if (colorValue.startsWith("#")) {
      return colorValue;
    }

    return colorValue;
  }

  return colorValue;
}

/**
 * 2D 节点工厂 - 负责将 SceneNode 转换为 PixiJS 对象
 */
export class NodeFactory2D {
  /**
   * 根据节点类型创建对应的 PixiJS 对象
   */
  createDisplayObject(node: SceneNode): Container | null {
    if (node.visible === false) return null;

    let displayObject: Container | null = null;

    switch (node.type) {
      case "group":
        displayObject = this.createGroup(node);
        break;
      case "rect":
        displayObject = this.createRect(node);
        break;
      case "circle":
        displayObject = this.createCircle(node);
        break;
      case "ellipse":
        displayObject = this.createEllipse(node);
        break;
      case "line":
        displayObject = this.createLine(node);
        break;
      case "polyline":
      case "polygon":
        displayObject = this.createPolyline(node);
        break;
      case "text":
        displayObject = this.createText(node);
        break;
      default:
        return null;
    }

    if (displayObject) {
      this.applyTransform(displayObject, node);
      displayObject.label = node.name || node.id;
      // 存储节点信息到 PixiJS 对象
      (displayObject as any).nodeId = node.id;
      (displayObject as any).nodeData = node;

      // 设置透明度
      if (node.opacity !== undefined) {
        displayObject.alpha = node.opacity;
      }

      // 启用交互
      displayObject.eventMode = "static";
      displayObject.cursor = "pointer";
    }

    return displayObject;
  }

  /**
   * 创建组
   */
  createGroup(node: SceneNode): Container {
    const container = new Container();

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childObject = this.createDisplayObject(child);
        if (childObject) {
          container.addChild(childObject);
        }
      }
    }

    return container;
  }

  /**
   * 创建矩形
   * 2D 模式是俯视图，所以：
   * - width (X轴) 对应 2D 的宽度
   * - depth (Z轴) 对应 2D 的高度
   */
  createRect(node: SceneNode): Graphics {
    const graphics = new Graphics();
    const geometry = node.geometry;
    const width = geometry?.width ?? 100;    // X 轴尺寸
    const depth = geometry?.depth ?? 100;    // Z 轴尺寸（2D 的高度）
    const cornerRadius = geometry?.cornerRadius;

    // 获取填充和描边颜色
    const fillColor = parseColor(node.style?.fill || node.material?.color);
    const strokeColor = parseColor(node.style?.stroke);
    const strokeWidth = node.style?.strokeWidth ?? 0;

    // 绘制矩形（width 是 X，depth 是 Z/2D高度）
    if (cornerRadius && typeof cornerRadius === "number" && cornerRadius > 0) {
      graphics.roundRect(0, 0, width, depth, cornerRadius);
    } else {
      graphics.rect(0, 0, width, depth);
    }

    // 填充
    graphics.fill(fillColor);

    // 描边
    if (strokeWidth > 0 && strokeColor) {
      graphics.stroke({ width: strokeWidth, color: strokeColor });
    }

    return graphics;
  }

  /**
   * 创建圆形
   */
  createCircle(node: SceneNode): Graphics {
    const graphics = new Graphics();
    const geometry = node.geometry;
    const radius = geometry?.radius ?? 50;

    const fillColor = parseColor(node.style?.fill || node.material?.color);
    const strokeColor = parseColor(node.style?.stroke);
    const strokeWidth = node.style?.strokeWidth ?? 0;

    graphics.circle(0, 0, radius);
    graphics.fill(fillColor);

    if (strokeWidth > 0 && strokeColor) {
      graphics.stroke({ width: strokeWidth, color: strokeColor });
    }

    return graphics;
  }

  /**
   * 创建椭圆
   */
  createEllipse(node: SceneNode): Graphics {
    const graphics = new Graphics();
    const geometry = node.geometry;
    const radiusX = geometry?.radiusX ?? geometry?.radius ?? 50;
    const radiusY = geometry?.radiusY ?? geometry?.radius ?? 30;

    const fillColor = parseColor(node.style?.fill || node.material?.color);
    const strokeColor = parseColor(node.style?.stroke);
    const strokeWidth = node.style?.strokeWidth ?? 0;

    graphics.ellipse(0, 0, radiusX, radiusY);
    graphics.fill(fillColor);

    if (strokeWidth > 0 && strokeColor) {
      graphics.stroke({ width: strokeWidth, color: strokeColor });
    }

    return graphics;
  }

  /**
   * 创建线条
   */
  createLine(node: SceneNode): Graphics {
    const graphics = new Graphics();
    const geometry = node.geometry;
    const points = geometry?.points || [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    const strokeColor = parseColor(node.style?.stroke || node.material?.color || 0x000000);
    const strokeWidth = node.style?.strokeWidth ?? 2;

    if (points.length >= 2) {
      graphics.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        graphics.lineTo(points[i].x, points[i].y);
      }
      graphics.stroke({ width: strokeWidth, color: strokeColor });
    }

    return graphics;
  }

  /**
   * 创建折线/多边形
   */
  createPolyline(node: SceneNode): Graphics {
    const graphics = new Graphics();
    const geometry = node.geometry;
    const points = geometry?.points || [];

    if (points.length < 2) {
      return graphics;
    }

    const fillColor = parseColor(node.style?.fill || node.material?.color);
    const strokeColor = parseColor(node.style?.stroke);
    const strokeWidth = node.style?.strokeWidth ?? 2;
    const isClosed = node.type === "polygon" || geometry?.closed;

    // 转换点格式
    const flatPoints: number[] = [];
    for (const p of points) {
      flatPoints.push(p.x, p.y);
    }

    graphics.poly(flatPoints, isClosed);

    if (isClosed && fillColor) {
      graphics.fill(fillColor);
    }

    if (strokeWidth > 0 && strokeColor) {
      graphics.stroke({ width: strokeWidth, color: strokeColor });
    }

    return graphics;
  }

  /**
   * 创建文本
   */
  createText(node: SceneNode): Text {
    const style = node.style;
    const textContent = style?.text || "";

    const textStyle = new TextStyle({
      fontSize: style?.fontSize ?? 16,
      fontFamily: style?.fontFamily ?? "Arial",
      fontWeight: style?.fontWeight as any ?? "normal",
      fontStyle: style?.fontStyle ?? "normal",
      fill: parseColor(style?.fill || node.material?.color || 0x000000),
      align: style?.textAlign ?? "left",
      letterSpacing: style?.letterSpacing ?? 0,
      lineHeight: style?.lineHeight,
    });

    const text = new Text({ text: textContent, style: textStyle });

    return text;
  }

  /**
   * 应用变换
   * 注意：2D 是俯视图，坐标映射关系为：
   * - SceneModel (3D): position.x -> 2D: x
   * - SceneModel (3D): position.z -> 2D: y
   * - SceneModel (3D): position.y 是高度，2D 中不显示
   */
  applyTransform(displayObject: Container, node: SceneNode) {
    const transform = node.transform;
    if (!transform) return;

    // 设置位置：3D 的 x/z 映射到 2D 的 x/y
    const pos = transform.position;
    displayObject.position.set(pos.x, pos.z);

    // 设置旋转（角度转弧度，2D 只使用 z 轴，对应 3D 的 y 轴旋转）
    if (transform.rotation) {
      const rotY = transform.rotation.y ?? 0;
      displayObject.rotation = (rotY * Math.PI) / 180;
    }

    // 设置缩放
    if (transform.scale) {
      displayObject.scale.set(transform.scale.x, transform.scale.z);
    }

    // 设置锚点/中心点
    if (transform.anchor && displayObject instanceof Graphics) {
      displayObject.pivot.set(
        transform.anchor.x * (node.geometry?.width ?? 0),
        transform.anchor.y * (node.geometry?.height ?? 0)
      );
    }

    // 设置斜切
    if (transform.skew) {
      displayObject.skew.set(
        (transform.skew.x * Math.PI) / 180,
        (transform.skew.y * Math.PI) / 180
      );
    }
  }
}

// 导出单例
export const nodeFactory2D = new NodeFactory2D();
