import { Container, Graphics, FederatedPointerEvent, ColorSource } from "pixi.js";

export type SelectionChangeCallback2D = (object: Container | null) => void;

export interface Selector2DOptions {
  /** 选中时显示边界框 */
  showBoundingBox?: boolean;
  /** 边界框颜色 */
  boundingBoxColor?: ColorSource;
  /** 边界框线宽 */
  boundingBoxWidth?: number;
  /** 可选中的对象过滤函数 */
  filter?: (object: Container) => boolean;
}

const defaultOptions: Selector2DOptions = {
  showBoundingBox: true,
  boundingBoxColor: 0x00aaff,
  boundingBoxWidth: 2,
  filter: (obj) => {
    // 过滤掉辅助对象
    const label = obj.label || "";
    if (label.startsWith("__")) return false;
    return true;
  },
};

/**
 * 2D 选择器 - 负责处理 PixiJS 对象的选择
 */
export class Selector2D {
  private stage: Container;
  private options: Required<Selector2DOptions>;

  /** 当前选中的对象 */
  selected: Container | null = null;

  /** 边界框 */
  private boundingBox: Graphics | null = null;

  /** 选择变化回调 */
  private onChangeCallbacks: SelectionChangeCallback2D[] = [];

  constructor(stage: Container, options: Selector2DOptions = {}) {
    this.stage = stage;
    this.options = { ...defaultOptions, ...options } as Required<Selector2DOptions>;
  }

  /**
   * 从点击事件获取目标对象
   */
  getObjectAtPoint(globalX: number, globalY: number): Container | null {
    const objects = this.getSelectableObjects();

    // 从后往前遍历（后添加的在上层）
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const bounds = obj.getBounds();

      if (
        globalX >= bounds.x &&
        globalX <= bounds.x + bounds.width &&
        globalY >= bounds.y &&
        globalY <= bounds.y + bounds.height
      ) {
        return obj;
      }
    }

    return null;
  }

  /**
   * 获取所有可选择的对象
   */
  private getSelectableObjects(): Container[] {
    const objects: Container[] = [];

    const traverse = (container: Container) => {
      for (const child of container.children) {
        if (child instanceof Container) {
          // 检查是否有 nodeId（是我们创建的节点）
          if ((child as any).nodeId && this.options.filter(child)) {
            objects.push(child);
          }
          // 递归遍历子节点
          if (child.children && child.children.length > 0) {
            traverse(child);
          }
        }
      }
    };

    traverse(this.stage);
    return objects;
  }

  /**
   * 选择对象
   */
  select(object: Container | null): void {
    if (this.selected === object) return;

    this.selected = object;

    // 更新边界框
    this.updateBoundingBox();

    // 触发回调
    for (const callback of this.onChangeCallbacks) {
      callback(object);
    }
  }

  /**
   * 取消选择
   */
  deselect(): void {
    this.select(null);
  }

  /**
   * 通过点击位置选择对象
   */
  selectByPoint(globalX: number, globalY: number): Container | null {
    const object = this.getObjectAtPoint(globalX, globalY);
    this.select(object);
    return this.selected;
  }

  /**
   * 通过节点 ID 选择对象
   */
  selectByNodeId(nodeId: string): Container | null {
    const objects = this.getSelectableObjects();
    const found = objects.find((obj) => (obj as any).nodeId === nodeId);
    if (found) {
      this.select(found);
    }
    return found || null;
  }

  /**
   * 更新边界框显示
   */
  private updateBoundingBox(): void {
    // 移除旧的边界框
    if (this.boundingBox) {
      if (this.boundingBox.parent) {
        this.boundingBox.parent.removeChild(this.boundingBox);
      }
      this.boundingBox.destroy();
      this.boundingBox = null;
    }

    // 如果有选中对象且需要显示边界框
    if (this.selected && this.options.showBoundingBox) {
      const bounds = this.selected.getBounds();

      this.boundingBox = new Graphics();
      this.boundingBox.label = "__selectionBox__";
      this.boundingBox.rect(bounds.x, bounds.y, bounds.width, bounds.height);
      this.boundingBox.stroke({
        width: this.options.boundingBoxWidth,
        color: this.options.boundingBoxColor,
      });

      // 绘制控制点
      const handleSize = 8;
      const handles = [
        { x: bounds.x, y: bounds.y }, // 左上
        { x: bounds.x + bounds.width, y: bounds.y }, // 右上
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // 右下
        { x: bounds.x, y: bounds.y + bounds.height }, // 左下
        { x: bounds.x + bounds.width / 2, y: bounds.y }, // 上中
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // 右中
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // 下中
        { x: bounds.x, y: bounds.y + bounds.height / 2 }, // 左中
      ];

      for (const handle of handles) {
        this.boundingBox.rect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
        this.boundingBox.fill(0xffffff);
        this.boundingBox.stroke({
          width: 1,
          color: this.options.boundingBoxColor,
        });
      }

      this.stage.addChild(this.boundingBox);
    }
  }

  /**
   * 刷新边界框（当选中对象变换后调用）
   */
  refreshBoundingBox(): void {
    if (this.selected) {
      this.updateBoundingBox();
    }
  }

  /**
   * 添加选择变化监听
   */
  onChange(callback: SelectionChangeCallback2D): void {
    this.onChangeCallbacks.push(callback);
  }

  /**
   * 移除选择变化监听
   */
  offChange(callback: SelectionChangeCallback2D): void {
    const index = this.onChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * 获取边界框
   */
  getBoundingBox(): Graphics | null {
    return this.boundingBox;
  }

  /**
   * 销毁
   */
  dispose(): void {
    if (this.boundingBox) {
      if (this.boundingBox.parent) {
        this.boundingBox.parent.removeChild(this.boundingBox);
      }
      this.boundingBox.destroy();
      this.boundingBox = null;
    }
    this.onChangeCallbacks = [];
    this.selected = null;
  }
}
