import { Container, Graphics, FederatedPointerEvent } from "pixi.js";
import { TransformMode2D, TransformChangeEvent2D } from "./types";

export type TransformChangeCallback2D = (event: TransformChangeEvent2D) => void;
export type TransformStartCallback2D = (object: Container) => void;
export type TransformEndCallback2D = (event: TransformChangeEvent2D) => void;

export interface Transformer2DOptions {
  /** 平移捕捉距离（null 表示不捕捉） */
  translationSnap?: number | null;
  /** 旋转捕捉角度（度，null 表示不捕捉） */
  rotationSnap?: number | null;
  /** 缩放捕捉因子（null 表示不捕捉） */
  scaleSnap?: number | null;
  /** 初始变换模式 */
  mode?: TransformMode2D;
  /** 控制手柄大小 */
  handleSize?: number;
  /** 控制手柄颜色 */
  handleColor?: number;
  /** 控制框颜色 */
  boxColor?: number;
  /** 旋转手柄距离 */
  rotationHandleDistance?: number;
}

const defaultOptions: Transformer2DOptions = {
  translationSnap: null,
  rotationSnap: null,
  scaleSnap: null,
  mode: "scale", // 默认模式改为 scale
  handleSize: 10,
  handleColor: 0x00aaff,
  boxColor: 0x00aaff,
  rotationHandleDistance: 30,
};

type HandleType = "tl" | "tr" | "br" | "bl" | "t" | "r" | "b" | "l" | "rotate";

/**
 * 2D 变换器 - 负责处理 PixiJS 对象的变换（移动、旋转、缩放）
 */
export class Transformer2D {
  private stage: Container;
  private canvas: HTMLCanvasElement;
  private options: Required<Transformer2DOptions>;
  /** 内容容器（用于坐标转换，当缩放/平移时） */
  private contentContainer: Container | null = null;

  /** 当前附加的对象 */
  private attachedObject: Container | null = null;

  /** 当前变换模式 */
  private currentMode: TransformMode2D = "scale";

  /** 变换控制器容器 */
  private controlsContainer: Container;

  /** 各个控制元素 */
  private borderLine: Graphics;
  private handles: Map<HandleType, Graphics> = new Map();
  private rotateHandle: Graphics;
  private rotateLine: Graphics;

  /** 变换前的状态 */
  private positionOnDown: { x: number; y: number } | null = null;
  private rotationOnDown: number | null = null;
  private scaleOnDown: { x: number; y: number } | null = null;

  /** 拖拽状态 */
  private _isDragging = false;
  private dragStartPoint: { x: number; y: number } | null = null;
  private activeHandle: HandleType | null = null;

  /** 回调 */
  private onChangeCallbacks: TransformChangeCallback2D[] = [];
  private onStartCallbacks: TransformStartCallback2D[] = [];
  private onEndCallbacks: TransformEndCallback2D[] = [];

  /** 绑定的事件处理函数 */
  private boundOnPointerMove: (e: PointerEvent) => void;
  private boundOnPointerUp: (e: PointerEvent) => void;

  constructor(
    stage: Container,
    canvas: HTMLCanvasElement,
    options: Transformer2DOptions = {},
    contentContainer?: Container
  ) {
    this.stage = stage;
    this.canvas = canvas;
    this.options = {
      ...defaultOptions,
      ...options,
    } as Required<Transformer2DOptions>;
    this.currentMode = this.options.mode;
    this.contentContainer = contentContainer || null;

    // 绑定事件处理函数
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerUp = this.onPointerUp.bind(this);

    // 创建控制器容器
    this.controlsContainer = new Container();
    this.controlsContainer.label = "__transformer__";
    this.controlsContainer.visible = false;
    this.controlsContainer.eventMode = "static";

    // 创建边框线
    this.borderLine = new Graphics();
    this.borderLine.label = "__borderLine__";
    this.controlsContainer.addChild(this.borderLine);

    // 创建旋转连接线
    this.rotateLine = new Graphics();
    this.rotateLine.label = "__rotateLine__";
    this.controlsContainer.addChild(this.rotateLine);

    // 创建旋转手柄
    this.rotateHandle = this.createInteractiveGraphics(
      "__rotateHandle__",
      "crosshair"
    );
    this.controlsContainer.addChild(this.rotateHandle);

    // 创建缩放手柄
    this.createHandles();

    // 添加到舞台
    this.stage.addChild(this.controlsContainer);

    // 绑定 PixiJS 事件
    this.bindPixiEvents();

    // 绑定 DOM 事件
    this.bindDOMEvents();
  }

  /**
   * 创建可交互的 Graphics
   */
  private createInteractiveGraphics(label: string, cursor: string): Graphics {
    const g = new Graphics();
    g.label = label;
    g.eventMode = "static";
    g.cursor = cursor;
    g.interactive = true;
    return g;
  }

  /**
   * 创建缩放手柄
   */
  private createHandles(): void {
    const handleTypes: HandleType[] = [
      "tl",
      "tr",
      "br",
      "bl",
      "t",
      "r",
      "b",
      "l",
    ];
    const cursors: Record<string, string> = {
      tl: "nwse-resize",
      tr: "nesw-resize",
      br: "nwse-resize",
      bl: "nesw-resize",
      t: "ns-resize",
      r: "ew-resize",
      b: "ns-resize",
      l: "ew-resize",
    };

    for (const type of handleTypes) {
      const handle = this.createInteractiveGraphics(
        `__handle_${type}__`,
        cursors[type]
      );
      this.handles.set(type, handle);
      this.controlsContainer.addChild(handle);
    }
  }

  /**
   * 绑定 PixiJS 事件
   */
  private bindPixiEvents(): void {
    // 旋转手柄
    this.rotateHandle.on("pointerdown", (e: FederatedPointerEvent) => {
      this.startDrag(e, "rotate");
    });

    // 缩放手柄
    this.handles.forEach((handle, type) => {
      handle.on("pointerdown", (e: FederatedPointerEvent) => {
        this.startDrag(e, type);
      });
    });
  }

  /**
   * 绑定 DOM 事件
   */
  private bindDOMEvents(): void {
    // 使用 document 监听，确保拖拽时鼠标移出画布也能继续
    document.addEventListener("pointermove", this.boundOnPointerMove);
    document.addEventListener("pointerup", this.boundOnPointerUp);
  }

  /**
   * 开始拖拽
   */
  private startDrag(
    event: FederatedPointerEvent,
    handleType: HandleType
  ): void {
    if (!this.attachedObject) return;

    event.stopPropagation();

    this._isDragging = true;
    this.activeHandle = handleType;
    this.dragStartPoint = { x: event.globalX, y: event.globalY };

    // 记录初始状态
    this.positionOnDown = {
      x: this.attachedObject.position.x,
      y: this.attachedObject.position.y,
    };
    this.rotationOnDown = this.attachedObject.rotation;
    this.scaleOnDown = {
      x: this.attachedObject.scale.x,
      y: this.attachedObject.scale.y,
    };

    // 触发开始回调
    for (const callback of this.onStartCallbacks) {
      callback(this.attachedObject);
    }
  }

  /**
   * 指针移动 (DOM 事件)
   */
  private onPointerMove(event: PointerEvent): void {
    if (
      !this._isDragging ||
      !this.attachedObject ||
      !this.dragStartPoint ||
      !this.activeHandle
    ) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const deltaX = currentX - this.dragStartPoint.x;
    const deltaY = currentY - this.dragStartPoint.y;

    if (this.activeHandle === "rotate") {
      this.handleRotate(currentX, currentY);
    } else {
      this.handleScale(this.activeHandle, deltaX, deltaY);
    }

    // 更新控制器显示
    this.updateControls();

    // 触发变换回调
    this.emitChangeEvent();
  }

  /**
   * 指针释放 (DOM 事件)
   */
  private onPointerUp(_event: PointerEvent): void {
    if (!this._isDragging) return;

    this._isDragging = false;

    // 触发结束回调
    if (this.attachedObject) {
      const hasChanged = this.checkHasChanged();
      if (hasChanged) {
        const evt: TransformChangeEvent2D = {
          object: this.attachedObject,
          mode: this.currentMode,
          position: {
            x: this.attachedObject.position.x,
            y: this.attachedObject.position.y,
          },
          rotation: this.attachedObject.rotation,
          scale: {
            x: this.attachedObject.scale.x,
            y: this.attachedObject.scale.y,
          },
        };

        for (const callback of this.onEndCallbacks) {
          callback(evt);
        }
      }
    }

    // 重置状态
    this.activeHandle = null;
    this.dragStartPoint = null;
    this.positionOnDown = null;
    this.rotationOnDown = null;
    this.scaleOnDown = null;
  }

  /**
   * 处理旋转
   */
  private handleRotate(currentX: number, currentY: number): void {
    if (!this.attachedObject) return;

    const bounds = this.attachedObject.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const angle = Math.atan2(currentY - centerY, currentX - centerX);
    let rotation = angle + Math.PI / 2;

    if (this.options.rotationSnap !== null) {
      const snapRadians = (this.options.rotationSnap * Math.PI) / 180;
      rotation = Math.round(rotation / snapRadians) * snapRadians;
    }

    this.attachedObject.rotation = rotation;
  }

  /**
   * 获取内容容器的缩放比例
   */
  private getContentScale(): number {
    return this.contentContainer?.scale.x ?? 1;
  }

  /**
   * 处理缩放
   */
  private handleScale(
    handleType: HandleType,
    deltaX: number,
    deltaY: number
  ): void {
    if (!this.attachedObject || !this.scaleOnDown) return;

    const bounds = this.attachedObject.getBounds();
    const scale = this.getContentScale();

    // 将屏幕坐标的 delta 转换为内容坐标系的 delta
    const contentDeltaX = deltaX / scale;
    const contentDeltaY = deltaY / scale;

    const originalWidth = bounds.width / scale / this.scaleOnDown.x;
    const originalHeight = bounds.height / scale / this.scaleOnDown.y;

    if (originalWidth === 0 || originalHeight === 0) return;

    let scaleX = this.scaleOnDown.x;
    let scaleY = this.scaleOnDown.y;

    switch (handleType) {
      case "tl":
        scaleX = this.scaleOnDown.x - contentDeltaX / originalWidth;
        scaleY = this.scaleOnDown.y - contentDeltaY / originalHeight;
        break;
      case "tr":
        scaleX = this.scaleOnDown.x + contentDeltaX / originalWidth;
        scaleY = this.scaleOnDown.y - contentDeltaY / originalHeight;
        break;
      case "br":
        scaleX = this.scaleOnDown.x + contentDeltaX / originalWidth;
        scaleY = this.scaleOnDown.y + contentDeltaY / originalHeight;
        break;
      case "bl":
        scaleX = this.scaleOnDown.x - contentDeltaX / originalWidth;
        scaleY = this.scaleOnDown.y + contentDeltaY / originalHeight;
        break;
      case "t":
        scaleY = this.scaleOnDown.y - contentDeltaY / originalHeight;
        break;
      case "b":
        scaleY = this.scaleOnDown.y + contentDeltaY / originalHeight;
        break;
      case "l":
        scaleX = this.scaleOnDown.x - contentDeltaX / originalWidth;
        break;
      case "r":
        scaleX = this.scaleOnDown.x + contentDeltaX / originalWidth;
        break;
    }

    scaleX = Math.max(0.01, scaleX);
    scaleY = Math.max(0.01, scaleY);

    if (this.options.scaleSnap !== null) {
      scaleX =
        Math.round(scaleX / this.options.scaleSnap) * this.options.scaleSnap;
      scaleY =
        Math.round(scaleY / this.options.scaleSnap) * this.options.scaleSnap;
    }

    this.attachedObject.scale.set(scaleX, scaleY);
  }

  /**
   * 检查是否发生了变换
   */
  private checkHasChanged(): boolean {
    if (!this.attachedObject) return false;

    if (this.positionOnDown) {
      if (
        this.positionOnDown.x !== this.attachedObject.position.x ||
        this.positionOnDown.y !== this.attachedObject.position.y
      ) {
        return true;
      }
    }

    if (
      this.rotationOnDown !== null &&
      this.rotationOnDown !== this.attachedObject.rotation
    ) {
      return true;
    }

    if (this.scaleOnDown) {
      if (
        this.scaleOnDown.x !== this.attachedObject.scale.x ||
        this.scaleOnDown.y !== this.attachedObject.scale.y
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * 触发变换事件
   */
  private emitChangeEvent(): void {
    if (!this.attachedObject) return;

    const evt: TransformChangeEvent2D = {
      object: this.attachedObject,
      mode: this.currentMode,
      position: {
        x: this.attachedObject.position.x,
        y: this.attachedObject.position.y,
      },
      rotation: this.attachedObject.rotation,
      scale: { x: this.attachedObject.scale.x, y: this.attachedObject.scale.y },
    };

    for (const callback of this.onChangeCallbacks) {
      callback(evt);
    }
  }

  /**
   * 更新控制器显示
   */
  updateControls(): void {
    if (!this.attachedObject || !this.controlsContainer.visible) return;

    const bounds = this.attachedObject.getBounds();
    const { handleSize, handleColor, boxColor, rotationHandleDistance } =
      this.options;

    // 清除所有图形
    this.borderLine.clear();
    this.rotateLine.clear();
    this.rotateHandle.clear();
    this.handles.forEach((h) => h.clear());

    // 绘制边框线
    this.borderLine.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.borderLine.stroke({ width: 2, color: boxColor });

    // 手柄位置
    const positions: Record<HandleType, { x: number; y: number }> = {
      tl: { x: bounds.x, y: bounds.y },
      tr: { x: bounds.x + bounds.width, y: bounds.y },
      br: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      bl: { x: bounds.x, y: bounds.y + bounds.height },
      t: { x: bounds.x + bounds.width / 2, y: bounds.y },
      r: { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      b: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      l: { x: bounds.x, y: bounds.y + bounds.height / 2 },
      rotate: {
        x: bounds.x + bounds.width / 2,
        y: bounds.y - rotationHandleDistance,
      },
    };

    // 绘制缩放手柄
    this.handles.forEach((handle, type) => {
      const pos = positions[type];
      const hs = handleSize;
      handle.rect(pos.x - hs / 2, pos.y - hs / 2, hs, hs);
      handle.fill({ color: 0xffffff });
      handle.stroke({ width: 1, color: handleColor });
    });

    // 绘制旋转连接线
    const topCenter = positions.t;
    const rotatePos = positions.rotate;
    this.rotateLine.moveTo(topCenter.x, topCenter.y);
    this.rotateLine.lineTo(rotatePos.x, rotatePos.y);
    this.rotateLine.stroke({ width: 1, color: boxColor });

    // 绘制旋转手柄
    const rhs = handleSize / 2 + 3;
    this.rotateHandle.circle(rotatePos.x, rotatePos.y, rhs);
    this.rotateHandle.fill({ color: 0xffffff });
    this.rotateHandle.stroke({ width: 1, color: handleColor });
  }

  /**
   * 附加到对象
   */
  attach(object: Container): void {
    this.attachedObject = object;
    this.controlsContainer.visible = true;
    this.updateControls();
  }

  /**
   * 分离对象
   */
  detach(): void {
    this.attachedObject = null;
    this.controlsContainer.visible = false;
  }

  /**
   * 获取当前附加的对象
   */
  getAttachedObject(): Container | null {
    return this.attachedObject;
  }

  /**
   * 设置变换模式
   */
  setMode(mode: TransformMode2D): void {
    this.currentMode = mode;
  }

  /**
   * 获取当前变换模式
   */
  getMode(): TransformMode2D {
    return this.currentMode;
  }

  /**
   * 设置平移捕捉
   */
  setTranslationSnap(snap: number | null): void {
    this.options.translationSnap = snap;
  }

  /**
   * 设置旋转捕捉（角度）
   */
  setRotationSnap(degrees: number | null): void {
    this.options.rotationSnap = degrees;
  }

  /**
   * 设置缩放捕捉
   */
  setScaleSnap(snap: number | null): void {
    this.options.scaleSnap = snap;
  }

  /**
   * 是否正在拖拽
   */
  isDraggingObject(): boolean {
    return this._isDragging;
  }

  /**
   * 获取控制器容器
   */
  getControlsContainer(): Container {
    return this.controlsContainer;
  }

  /**
   * 添加变换中回调
   */
  onTransformChange(callback: TransformChangeCallback2D): void {
    this.onChangeCallbacks.push(callback);
  }

  /**
   * 添加变换开始回调
   */
  onTransformStart(callback: TransformStartCallback2D): void {
    this.onStartCallbacks.push(callback);
  }

  /**
   * 添加变换结束回调
   */
  onTransformEnd(callback: TransformEndCallback2D): void {
    this.onEndCallbacks.push(callback);
  }

  /**
   * 移除变换中回调
   */
  offTransformChange(callback: TransformChangeCallback2D): void {
    const index = this.onChangeCallbacks.indexOf(callback);
    if (index !== -1) this.onChangeCallbacks.splice(index, 1);
  }

  /**
   * 移除变换开始回调
   */
  offTransformStart(callback: TransformStartCallback2D): void {
    const index = this.onStartCallbacks.indexOf(callback);
    if (index !== -1) this.onStartCallbacks.splice(index, 1);
  }

  /**
   * 移除变换结束回调
   */
  offTransformEnd(callback: TransformEndCallback2D): void {
    const index = this.onEndCallbacks.indexOf(callback);
    if (index !== -1) this.onEndCallbacks.splice(index, 1);
  }

  /**
   * 销毁
   */
  dispose(): void {
    // 移除 DOM 事件监听
    document.removeEventListener("pointermove", this.boundOnPointerMove);
    document.removeEventListener("pointerup", this.boundOnPointerUp);

    // 移除控制器
    if (this.controlsContainer.parent) {
      this.controlsContainer.parent.removeChild(this.controlsContainer);
    }
    this.controlsContainer.destroy({ children: true });

    this.onChangeCallbacks = [];
    this.onStartCallbacks = [];
    this.onEndCallbacks = [];
    this.attachedObject = null;
  }
}
