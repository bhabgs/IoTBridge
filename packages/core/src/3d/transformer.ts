import { Object3D, Camera, Vector3, Euler } from "three";
// @ts-ignore - Three.js examples don't have proper type declarations
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

export type TransformMode = "translate" | "rotate" | "scale";
export type TransformSpace = "world" | "local";

export interface TransformChangeEvent {
  object: Object3D;
  mode: TransformMode;
  position?: Vector3;
  rotation?: Euler;
  scale?: Vector3;
}

export type TransformChangeCallback = (event: TransformChangeEvent) => void;
export type TransformStartCallback = (object: Object3D) => void;
export type TransformEndCallback = (event: TransformChangeEvent) => void;

export interface TransformerOptions {
  /** 平移捕捉距离（null 表示不捕捉） */
  translationSnap?: number | null;
  /** 旋转捕捉角度（度，null 表示不捕捉） */
  rotationSnap?: number | null;
  /** 缩放捕捉因子（null 表示不捕捉） */
  scaleSnap?: number | null;
  /** 初始变换模式 */
  mode?: TransformMode;
  /** 初始变换空间 */
  space?: TransformSpace;
  /** 控制器大小 */
  size?: number;
}

const defaultOptions: TransformerOptions = {
  translationSnap: null,
  rotationSnap: null,
  scaleSnap: null,
  mode: "translate",
  space: "world",
  size: 1,
};

/**
 * 变换器 - 负责处理 3D 对象的变换（移动、旋转、缩放）
 */
export class Transformer {
  private camera: Camera;
  private domElement: HTMLElement;
  private options: Required<TransformerOptions>;

  /** Three.js TransformControls 实例 */
  controls: InstanceType<typeof TransformControls>;

  /** 当前附加的对象 */
  private attachedObject: Object3D | null = null;

  /** 当前变换空间 */
  private currentSpace: TransformSpace = "world";

  /** 变换前的状态（用于撤销） */
  private positionOnDown: Vector3 | null = null;
  private rotationOnDown: Euler | null = null;
  private scaleOnDown: Vector3 | null = null;

  /** 回调 */
  private onChangeCallbacks: TransformChangeCallback[] = [];
  private onStartCallbacks: TransformStartCallback[] = [];
  private onEndCallbacks: TransformEndCallback[] = [];

  /** 是否正在拖拽 */
  private isDragging = false;

  constructor(
    camera: Camera,
    domElement: HTMLElement,
    options: TransformerOptions = {}
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.options = { ...defaultOptions, ...options } as Required<TransformerOptions>;

    // 创建 TransformControls
    this.controls = new TransformControls(camera, domElement);
    this.controls.setMode(this.options.mode);
    this.controls.setSpace(this.options.space);
    this.controls.setSize(this.options.size);
    this.currentSpace = this.options.space;

    // 设置捕捉
    if (this.options.translationSnap !== null) {
      this.controls.setTranslationSnap(this.options.translationSnap);
    }
    if (this.options.rotationSnap !== null) {
      this.controls.setRotationSnap((this.options.rotationSnap * Math.PI) / 180);
    }
    if (this.options.scaleSnap !== null) {
      this.controls.setScaleSnap(this.options.scaleSnap);
    }

    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    this.controls.addEventListener("mouseDown", this.onMouseDown);
    this.controls.addEventListener("mouseUp", this.onMouseUp);
    this.controls.addEventListener("objectChange", this.onObjectChange);
  }

  /**
   * 鼠标按下 - 记录初始状态
   */
  private onMouseDown = (): void => {
    const object = this.controls.object;
    if (!object) return;

    this.isDragging = true;
    this.positionOnDown = object.position.clone();
    this.rotationOnDown = object.rotation.clone();
    this.scaleOnDown = object.scale.clone();

    // 触发开始回调
    for (const callback of this.onStartCallbacks) {
      callback(object);
    }
  };

  /**
   * 鼠标释放 - 触发变换结束事件
   */
  private onMouseUp = (): void => {
    const object = this.controls.object;
    if (!object || !this.isDragging) return;

    this.isDragging = false;
    const mode = this.controls.getMode() as TransformMode;

    const event: TransformChangeEvent = {
      object,
      mode,
    };

    // 检查是否真的发生了变换
    let hasChanged = false;

    switch (mode) {
      case "translate":
        if (this.positionOnDown && !this.positionOnDown.equals(object.position)) {
          event.position = object.position.clone();
          hasChanged = true;
        }
        break;
      case "rotate":
        if (this.rotationOnDown && !this.rotationOnDown.equals(object.rotation)) {
          event.rotation = object.rotation.clone();
          hasChanged = true;
        }
        break;
      case "scale":
        if (this.scaleOnDown && !this.scaleOnDown.equals(object.scale)) {
          event.scale = object.scale.clone();
          hasChanged = true;
        }
        break;
    }

    // 只有真正变换了才触发结束回调
    if (hasChanged) {
      for (const callback of this.onEndCallbacks) {
        callback(event);
      }
    }

    // 清除初始状态
    this.positionOnDown = null;
    this.rotationOnDown = null;
    this.scaleOnDown = null;
  };

  /**
   * 对象变换时触发
   */
  private onObjectChange = (): void => {
    const object = this.controls.object;
    if (!object) return;

    const mode = this.controls.getMode() as TransformMode;
    const event: TransformChangeEvent = {
      object,
      mode,
      position: object.position.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone(),
    };

    for (const callback of this.onChangeCallbacks) {
      callback(event);
    }
  };

  /**
   * 附加到对象
   */
  attach(object: Object3D): void {
    this.attachedObject = object;
    this.controls.attach(object);
  }

  /**
   * 分离对象
   */
  detach(): void {
    this.attachedObject = null;
    this.controls.detach();
  }

  /**
   * 获取当前附加的对象
   */
  getAttachedObject(): Object3D | null {
    return this.attachedObject;
  }

  /**
   * 设置变换模式
   */
  setMode(mode: TransformMode): void {
    this.controls.setMode(mode);
  }

  /**
   * 获取当前变换模式
   */
  getMode(): TransformMode {
    return this.controls.getMode() as TransformMode;
  }

  /**
   * 设置变换空间
   */
  setSpace(space: TransformSpace): void {
    this.currentSpace = space;
    this.controls.setSpace(space);
  }

  /**
   * 获取当前变换空间
   */
  getSpace(): TransformSpace {
    return this.currentSpace;
  }

  /**
   * 设置控制器大小
   */
  setSize(size: number): void {
    this.controls.setSize(size);
  }

  /**
   * 设置平移捕捉
   */
  setTranslationSnap(snap: number | null): void {
    this.controls.setTranslationSnap(snap);
  }

  /**
   * 设置旋转捕捉（角度）
   */
  setRotationSnap(degrees: number | null): void {
    if (degrees === null) {
      this.controls.setRotationSnap(null);
    } else {
      this.controls.setRotationSnap((degrees * Math.PI) / 180);
    }
  }

  /**
   * 设置缩放捕捉
   */
  setScaleSnap(snap: number | null): void {
    this.controls.setScaleSnap(snap);
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  /**
   * 是否启用
   */
  isEnabled(): boolean {
    return this.controls.enabled;
  }

  /**
   * 是否正在拖拽
   */
  isDraggingObject(): boolean {
    return this.isDragging;
  }

  /**
   * 更新相机
   */
  setCamera(camera: Camera): void {
    this.camera = camera;
    this.controls.camera = camera;
  }

  /**
   * 获取辅助对象（添加到场景中）
   */
  getHelper(): Object3D {
    return this.controls.getHelper();
  }

  /**
   * 添加变换中回调
   */
  onTransformChange(callback: TransformChangeCallback): void {
    this.onChangeCallbacks.push(callback);
  }

  /**
   * 添加变换开始回调
   */
  onTransformStart(callback: TransformStartCallback): void {
    this.onStartCallbacks.push(callback);
  }

  /**
   * 添加变换结束回调
   */
  onTransformEnd(callback: TransformEndCallback): void {
    this.onEndCallbacks.push(callback);
  }

  /**
   * 移除变换中回调
   */
  offTransformChange(callback: TransformChangeCallback): void {
    const index = this.onChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * 移除变换开始回调
   */
  offTransformStart(callback: TransformStartCallback): void {
    const index = this.onStartCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onStartCallbacks.splice(index, 1);
    }
  }

  /**
   * 移除变换结束回调
   */
  offTransformEnd(callback: TransformEndCallback): void {
    const index = this.onEndCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onEndCallbacks.splice(index, 1);
    }
  }

  /**
   * 销毁
   */
  dispose(): void {
    this.controls.removeEventListener("mouseDown", this.onMouseDown);
    this.controls.removeEventListener("mouseUp", this.onMouseUp);
    this.controls.removeEventListener("objectChange", this.onObjectChange);
    this.controls.dispose();
    this.onChangeCallbacks = [];
    this.onStartCallbacks = [];
    this.onEndCallbacks = [];
    this.attachedObject = null;
  }
}
