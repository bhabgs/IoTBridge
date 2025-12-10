import { Container, Graphics, FederatedPointerEvent, Point } from "pixi.js";
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
  mode: "translate",
  handleSize: 10,
  handleColor: 0x00aaff,
  boxColor: 0x00aaff,
  rotationHandleDistance: 30,
};

type HandleType = "tl" | "tr" | "br" | "bl" | "t" | "r" | "b" | "l" | "rotate" | "body";

/**
 * 2D 变换器 - 负责处理 PixiJS 对象的变换（移动、旋转、缩放）
 */
export class Transformer2D {
  private stage: Container;
  private options: Required<Transformer2DOptions>;

  /** 当前附加的对象 */
  private attachedObject: Container | null = null;

  /** 当前变换模式 */
  private currentMode: TransformMode2D = "translate";

  /** 变换控制器容器 */
  private controlsContainer: Container;

  /** 控制框 */
  private boundingBox: Graphics;

  /** 控制手柄 */
  private handles: Map<HandleType, Graphics> = new Map();

  /** 旋转手柄 */
  private rotateHandle: Graphics;

  /** 变换前的状态 */
  private positionOnDown: { x: number; y: number } | null = null;
  private rotationOnDown: number | null = null;
  private scaleOnDown: { x: number; y: number } | null = null;

  /** 拖拽状态 */
  private isDragging = false;
  private dragStartPoint: Point | null = null;
  private activeHandle: HandleType | null = null;

  /** 回调 */
  private onChangeCallbacks: TransformChangeCallback2D[] = [];
  private onStartCallbacks: TransformStartCallback2D[] = [];
  private onEndCallbacks: TransformEndCallback2D[] = [];

  constructor(stage: Container, options: Transformer2DOptions = {}) {
    this.stage = stage;
    this.options = { ...defaultOptions, ...options } as Required<Transformer2DOptions>;
    this.currentMode = this.options.mode;

    // 创建控制器容器
    this.controlsContainer = new Container();
    this.controlsContainer.label = "__transformer__";
    this.controlsContainer.visible = false;

    // 创建边界框
    this.boundingBox = new Graphics();
    this.boundingBox.label = "__transformerBox__";
    this.boundingBox.eventMode = "static";
    this.boundingBox.cursor = "move";
    this.controlsContainer.addChild(this.boundingBox);

    // 创建旋转手柄
    this.rotateHandle = new Graphics();
    this.rotateHandle.label = "__rotateHandle__";
    this.rotateHandle.eventMode = "static";
    this.rotateHandle.cursor = "crosshair";
    this.controlsContainer.addChild(this.rotateHandle);

    // 创建缩放手柄
    this.createHandles();

    // 添加到舞台
    this.stage.addChild(this.controlsContainer);

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 创建缩放手柄
   */
  private createHandles(): void {
    const handleTypes: HandleType[] = ["tl", "tr", "br", "bl", "t", "r", "b", "l"];
    const cursors: Record<HandleType, string> = {
      tl: "nwse-resize",
      tr: "nesw-resize",
      br: "nwse-resize",
      bl: "nesw-resize",
      t: "ns-resize",
      r: "ew-resize",
      b: "ns-resize",
      l: "ew-resize",
      rotate: "crosshair",
      body: "move",
    };

    for (const type of handleTypes) {
      const handle = new Graphics();
      handle.label = `__handle_${type}__`;
      handle.eventMode = "static";
      handle.cursor = cursors[type];
      this.handles.set(type, handle);
      this.controlsContainer.addChild(handle);
    }
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    // 边界框拖拽（移动）
    this.boundingBox.on("pointerdown", (e) => this.onHandlePointerDown(e, "body"));

    // 旋转手柄
    this.rotateHandle.on("pointerdown", (e) => this.onHandlePointerDown(e, "rotate"));

    // 缩放手柄
    this.handles.forEach((handle, type) => {
      handle.on("pointerdown", (e) => this.onHandlePointerDown(e, type));
    });

    // 全局移动和释放事件
    this.stage.on("pointermove", this.onPointerMove);
    this.stage.on("pointerup", this.onPointerUp);
    this.stage.on("pointerupoutside", this.onPointerUp);
  }

  /**
   * 手柄按下
   */
  private onHandlePointerDown = (event: FederatedPointerEvent, handleType: HandleType): void => {
    if (!this.attachedObject) return;

    event.stopPropagation();
    this.isDragging = true;
    this.activeHandle = handleType;
    this.dragStartPoint = event.global.clone();

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
  };

  /**
   * 指针移动
   */
  private onPointerMove = (event: FederatedPointerEvent): void => {
    if (!this.isDragging || !this.attachedObject || !this.dragStartPoint || !this.activeHandle) return;

    const currentPoint = event.global;
    const deltaX = currentPoint.x - this.dragStartPoint.x;
    const deltaY = currentPoint.y - this.dragStartPoint.y;

    if (this.activeHandle === "body") {
      // 移动
      this.handleTranslate(deltaX, deltaY);
    } else if (this.activeHandle === "rotate") {
      // 旋转
      this.handleRotate(currentPoint);
    } else {
      // 缩放
      this.handleScale(this.activeHandle, deltaX, deltaY);
    }

    // 更新控制器显示
    this.updateControls();

    // 触发变换回调
    this.emitChangeEvent();
  };

  /**
   * 指针释放
   */
  private onPointerUp = (): void => {
    if (!this.isDragging || !this.attachedObject) return;

    this.isDragging = false;

    // 触发结束回调
    const hasChanged = this.checkHasChanged();
    if (hasChanged) {
      const event: TransformChangeEvent2D = {
        object: this.attachedObject,
        mode: this.currentMode,
        position: { x: this.attachedObject.position.x, y: this.attachedObject.position.y },
        rotation: this.attachedObject.rotation,
        scale: { x: this.attachedObject.scale.x, y: this.attachedObject.scale.y },
      };

      for (const callback of this.onEndCallbacks) {
        callback(event);
      }
    }

    // 重置状态
    this.activeHandle = null;
    this.dragStartPoint = null;
    this.positionOnDown = null;
    this.rotationOnDown = null;
    this.scaleOnDown = null;
  };

  /**
   * 处理移动
   */
  private handleTranslate(deltaX: number, deltaY: number): void {
    if (!this.attachedObject || !this.positionOnDown) return;

    let newX = this.positionOnDown.x + deltaX;
    let newY = this.positionOnDown.y + deltaY;

    // 应用捕捉
    if (this.options.translationSnap !== null) {
      newX = Math.round(newX / this.options.translationSnap) * this.options.translationSnap;
      newY = Math.round(newY / this.options.translationSnap) * this.options.translationSnap;
    }

    this.attachedObject.position.set(newX, newY);
  }

  /**
   * 处理旋转
   */
  private handleRotate(currentPoint: Point): void {
    if (!this.attachedObject) return;

    const bounds = this.attachedObject.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // 计算角度
    const angle = Math.atan2(currentPoint.y - centerY, currentPoint.x - centerX);
    let rotation = angle + Math.PI / 2; // 调整到顶部为0

    // 应用捕捉
    if (this.options.rotationSnap !== null) {
      const snapRadians = (this.options.rotationSnap * Math.PI) / 180;
      rotation = Math.round(rotation / snapRadians) * snapRadians;
    }

    this.attachedObject.rotation = rotation;
  }

  /**
   * 处理缩放
   */
  private handleScale(handleType: HandleType, deltaX: number, deltaY: number): void {
    if (!this.attachedObject || !this.scaleOnDown) return;

    const bounds = this.attachedObject.getBounds();
    const originalWidth = bounds.width / this.scaleOnDown.x;
    const originalHeight = bounds.height / this.scaleOnDown.y;

    let scaleX = this.scaleOnDown.x;
    let scaleY = this.scaleOnDown.y;

    // 根据手柄类型计算缩放
    switch (handleType) {
      case "tl":
        scaleX = this.scaleOnDown.x - deltaX / originalWidth;
        scaleY = this.scaleOnDown.y - deltaY / originalHeight;
        break;
      case "tr":
        scaleX = this.scaleOnDown.x + deltaX / originalWidth;
        scaleY = this.scaleOnDown.y - deltaY / originalHeight;
        break;
      case "br":
        scaleX = this.scaleOnDown.x + deltaX / originalWidth;
        scaleY = this.scaleOnDown.y + deltaY / originalHeight;
        break;
      case "bl":
        scaleX = this.scaleOnDown.x - deltaX / originalWidth;
        scaleY = this.scaleOnDown.y + deltaY / originalHeight;
        break;
      case "t":
        scaleY = this.scaleOnDown.y - deltaY / originalHeight;
        break;
      case "b":
        scaleY = this.scaleOnDown.y + deltaY / originalHeight;
        break;
      case "l":
        scaleX = this.scaleOnDown.x - deltaX / originalWidth;
        break;
      case "r":
        scaleX = this.scaleOnDown.x + deltaX / originalWidth;
        break;
    }

    // 防止缩放到负值
    scaleX = Math.max(0.01, scaleX);
    scaleY = Math.max(0.01, scaleY);

    // 应用捕捉
    if (this.options.scaleSnap !== null) {
      scaleX = Math.round(scaleX / this.options.scaleSnap) * this.options.scaleSnap;
      scaleY = Math.round(scaleY / this.options.scaleSnap) * this.options.scaleSnap;
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

    if (this.rotationOnDown !== null && this.rotationOnDown !== this.attachedObject.rotation) {
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

    const event: TransformChangeEvent2D = {
      object: this.attachedObject,
      mode: this.currentMode,
      position: { x: this.attachedObject.position.x, y: this.attachedObject.position.y },
      rotation: this.attachedObject.rotation,
      scale: { x: this.attachedObject.scale.x, y: this.attachedObject.scale.y },
    };

    for (const callback of this.onChangeCallbacks) {
      callback(event);
    }
  }

  /**
   * 更新控制器显示
   */
  updateControls(): void {
    if (!this.attachedObject || !this.controlsContainer.visible) return;

    const bounds = this.attachedObject.getBounds();
    const { handleSize, handleColor, boxColor, rotationHandleDistance } = this.options;

    // 绘制边界框
    this.boundingBox.clear();
    this.boundingBox.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.boundingBox.stroke({ width: 2, color: boxColor });

    // 手柄位置
    const handlePositions: Record<HandleType, { x: number; y: number }> = {
      tl: { x: bounds.x, y: bounds.y },
      tr: { x: bounds.x + bounds.width, y: bounds.y },
      br: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      bl: { x: bounds.x, y: bounds.y + bounds.height },
      t: { x: bounds.x + bounds.width / 2, y: bounds.y },
      r: { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      b: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      l: { x: bounds.x, y: bounds.y + bounds.height / 2 },
      rotate: { x: bounds.x + bounds.width / 2, y: bounds.y - rotationHandleDistance },
      body: { x: 0, y: 0 },
    };

    // 绘制缩放手柄
    this.handles.forEach((handle, type) => {
      handle.clear();
      const pos = handlePositions[type];
      handle.rect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
      handle.fill(0xffffff);
      handle.stroke({ width: 1, color: handleColor });
    });

    // 绘制旋转手柄
    this.rotateHandle.clear();
    const rotatePos = handlePositions.rotate;

    // 连接线
    this.rotateHandle.moveTo(handlePositions.t.x, handlePositions.t.y);
    this.rotateHandle.lineTo(rotatePos.x, rotatePos.y);
    this.rotateHandle.stroke({ width: 1, color: boxColor });

    // 旋转手柄圆形
    this.rotateHandle.circle(rotatePos.x, rotatePos.y, handleSize / 2);
    this.rotateHandle.fill(0xffffff);
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
    return this.isDragging;
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
    if (index !== -1) {
      this.onChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * 移除变换开始回调
   */
  offTransformStart(callback: TransformStartCallback2D): void {
    const index = this.onStartCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onStartCallbacks.splice(index, 1);
    }
  }

  /**
   * 移除变换结束回调
   */
  offTransformEnd(callback: TransformEndCallback2D): void {
    const index = this.onEndCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onEndCallbacks.splice(index, 1);
    }
  }

  /**
   * 销毁
   */
  dispose(): void {
    // 移除事件监听
    this.stage.off("pointermove", this.onPointerMove);
    this.stage.off("pointerup", this.onPointerUp);
    this.stage.off("pointerupoutside", this.onPointerUp);

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
