import {
  Object3D,
  Mesh,
  Group,
  Raycaster,
  Vector2,
  PerspectiveCamera,
  Scene,
} from "three";
import type { SelectionCallbacks } from "./types";
import type { ControlsManager } from "./controls";

export interface SelectionManagerOptions {
  camera: PerspectiveCamera;
  scene: Scene;
  domElement: HTMLCanvasElement;
  controlsManager: ControlsManager;
  callbacks?: SelectionCallbacks;
}

/**
 * 选择管理器 - 负责对象的选择、取消选择和删除
 */
export class SelectionManager {
  private camera: PerspectiveCamera;
  private scene: Scene;
  private domElement: HTMLCanvasElement;
  private controlsManager: ControlsManager;
  private callbacks: SelectionCallbacks;

  private raycaster: Raycaster = new Raycaster();
  private mouse: Vector2 = new Vector2();

  selectableObjects: Object3D[] = [];
  selectedObject: Object3D | null = null;

  constructor(options: SelectionManagerOptions) {
    this.camera = options.camera;
    this.scene = options.scene;
    this.domElement = options.domElement;
    this.controlsManager = options.controlsManager;
    this.callbacks = options.callbacks || {};

    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  private bindEvents() {
    this.domElement.addEventListener("click", this.onClick);
  }

  /**
   * 点击事件处理
   */
  private onClick = (event: MouseEvent) => {
    // 如果正在使用变换控制器，不进行选择
    if (this.controlsManager.transformControls.dragging) return;

    // 计算鼠标位置（归一化设备坐标）
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log("Click detected, mouse:", this.mouse.x, this.mouse.y);
    console.log("Selectable objects:", this.selectableObjects.length);

    // 射线检测
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.selectableObjects,
      true
    );

    console.log("Intersects:", intersects.length);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      this.select(object);
    } else {
      this.deselect();
    }
  };

  /**
   * 选中对象
   */
  select(object: Object3D) {
    this.selectedObject = object;
    this.controlsManager.transformControls.attach(object);
    console.log("Selected:", object.name, object.userData);
    this.callbacks.onSelect?.(object);
  }

  /**
   * 取消选择
   */
  deselect() {
    this.selectedObject = null;
    this.controlsManager.transformControls.detach();
    this.callbacks.onDeselect?.();
  }

  /**
   * 删除选中的对象
   */
  deleteSelected(): Object3D | null {
    if (!this.selectedObject) return null;

    const object = this.selectedObject;
    this.deselect();

    // 从场景中移除
    this.scene.remove(object);

    // 从可选对象列表中移除
    const index = this.selectableObjects.indexOf(object);
    if (index > -1) {
      this.selectableObjects.splice(index, 1);
    }

    console.log("Deleted:", object.name, object.userData);
    this.callbacks.onDelete?.(object);

    return object;
  }

  /**
   * 收集可选择的对象
   */
  collectSelectableObjects(object: Object3D) {
    if (object instanceof Mesh) {
      this.selectableObjects.push(object);
      console.log("Added selectable Mesh:", object.name, object);
    }
    if (object instanceof Group) {
      this.selectableObjects.push(object);
      console.log("Added selectable Group:", object.name, object);
    }
    // 递归收集子对象
    object.children.forEach((child) => {
      this.collectSelectableObjects(child);
    });
  }

  /**
   * 清空可选对象列表
   */
  clearSelectableObjects() {
    this.selectableObjects = [];
  }

  /**
   * 销毁
   */
  dispose() {
    this.domElement.removeEventListener("click", this.onClick);
  }
}
