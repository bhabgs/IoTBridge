import type { PerspectiveCamera } from "three";
// @ts-ignore - Three.js examples don't have proper type declarations
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// @ts-ignore - Three.js examples don't have proper type declarations
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { TransformMode } from "./types";

export interface ControlsOptions {
  camera: PerspectiveCamera;
  domElement: HTMLCanvasElement;
  onDraggingChanged?: (isDragging: boolean) => void;
  onObjectChange?: () => void;
}

/**
 * 控制器管理器 - 管理轨道控制器和变换控制器
 */
export class ControlsManager {
  orbitControls: InstanceType<typeof OrbitControls>;
  transformControls: InstanceType<typeof TransformControls>;

  constructor(options: ControlsOptions) {
    const { camera, domElement, onDraggingChanged, onObjectChange } = options;

    // 创建轨道控制器（旋转/缩放/平移视角）
    this.orbitControls = new OrbitControls(camera, domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 50;
    this.orbitControls.maxDistance = 2000;

    // 创建变换控制器（拖拽/旋转/缩放元素）
    this.transformControls = new TransformControls(camera, domElement);

    // 拖拽元素时禁用轨道控制器
    this.transformControls.addEventListener(
      "dragging-changed",
      (event: { value: boolean }) => {
        this.orbitControls.enabled = !event.value;
        onDraggingChanged?.(event.value);
      }
    );

    // 元素变换时触发更新
    this.transformControls.addEventListener("objectChange", () => {
      onObjectChange?.();
    });
  }

  /**
   * 设置变换模式
   */
  setTransformMode(mode: TransformMode) {
    this.transformControls.setMode(mode);
  }

  /**
   * 获取当前变换模式
   */
  getTransformMode(): TransformMode {
    return this.transformControls.mode as TransformMode;
  }

  /**
   * 更新控制器（在动画循环中调用）
   */
  update() {
    this.orbitControls.update();
  }

  /**
   * 销毁控制器
   */
  dispose() {
    this.orbitControls.dispose();
    this.transformControls.dispose();
  }
}
