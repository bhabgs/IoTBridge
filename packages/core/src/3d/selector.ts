import {
  Object3D,
  Raycaster,
  Vector2,
  Camera,
  Scene,
  Mesh,
  Line,
  Points,
  BoxHelper,
  Box3,
  ColorRepresentation,
} from "three";

export type SelectionChangeCallback = (object: Object3D | null) => void;

export interface SelectorOptions {
  /** 选中时显示边界框 */
  showBoundingBox?: boolean;
  /** 边界框颜色 */
  boundingBoxColor?: ColorRepresentation;
  /** 可选中的对象过滤函数 */
  filter?: (object: Object3D) => boolean;
}

const defaultOptions: SelectorOptions = {
  showBoundingBox: true,
  boundingBoxColor: 0xffff00,
  filter: (obj) => {
    // 过滤掉辅助对象和特殊名称的对象
    if (obj.name.startsWith("__")) return false;
    if (obj.type === "GridHelper" || obj.type === "AxesHelper") return false;
    return true;
  },
};

/**
 * 选择器 - 负责处理 3D 对象的选择
 */
export class Selector {
  private scene: Scene;
  private camera: Camera;
  private raycaster: Raycaster;
  private mouse: Vector2;
  private options: Required<SelectorOptions>;

  /** 当前选中的对象 */
  selected: Object3D | null = null;

  /** 边界框辅助线 */
  private boxHelper: BoxHelper | null = null;
  private box: Box3;

  /** 选择变化回调 */
  private onChangeCallbacks: SelectionChangeCallback[] = [];

  constructor(scene: Scene, camera: Camera, options: SelectorOptions = {}) {
    this.scene = scene;
    this.camera = camera;
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
    this.box = new Box3();
    this.options = { ...defaultOptions, ...options } as Required<SelectorOptions>;
  }

  /**
   * 更新相机引用
   */
  setCamera(camera: Camera) {
    this.camera = camera;
  }

  /**
   * 从指针位置获取交叉对象
   * @param point 归一化的屏幕坐标 (0-1)
   */
  getPointerIntersects(point: { x: number; y: number }): Object3D[] {
    // 将归一化坐标转换为 NDC 坐标 (-1 到 1)
    this.mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    return this.getIntersects();
  }

  /**
   * 获取射线检测的交叉对象
   */
  private getIntersects(): Object3D[] {
    const objects: Object3D[] = [];

    this.scene.traverseVisible((child) => {
      // 只检测可被射线检测的对象
      if (child instanceof Mesh || child instanceof Line || child instanceof Points) {
        if (this.options.filter(child)) {
          objects.push(child);
        }
      }
    });

    const intersects = this.raycaster.intersectObjects(objects, false);
    return intersects.map((i) => i.object);
  }

  /**
   * 选择对象
   */
  select(object: Object3D | null): void {
    if (this.selected === object) return;

    const previousSelected = this.selected;
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
   * @param point 归一化的屏幕坐标 (0-1)
   */
  selectByPointer(point: { x: number; y: number }): Object3D | null {
    const intersects = this.getPointerIntersects(point);

    if (intersects.length > 0) {
      // 如果点击的是已选中对象，尝试选择下一个对象（支持循环选择重叠对象）
      const currentIndex = this.selected ? intersects.indexOf(this.selected) : -1;

      if (currentIndex !== -1 && currentIndex < intersects.length - 1) {
        this.select(intersects[currentIndex + 1]);
      } else {
        this.select(intersects[0]);
      }
    } else {
      this.select(null);
    }

    return this.selected;
  }

  /**
   * 通过 ID 选择对象
   */
  selectById(id: number): Object3D | null {
    const object = this.scene.getObjectById(id);
    if (object) {
      this.select(object);
    }
    return object || null;
  }

  /**
   * 通过 UUID 选择对象
   */
  selectByUuid(uuid: string): Object3D | null {
    let found: Object3D | null = null;
    this.scene.traverse((child) => {
      if (child.uuid === uuid) {
        found = child;
      }
    });
    if (found) {
      this.select(found);
    }
    return found;
  }

  /**
   * 通过节点 ID（userData.nodeId）选择对象
   */
  selectByNodeId(nodeId: string): Object3D | null {
    let found: Object3D | null = null;
    this.scene.traverse((child) => {
      if (child.userData?.nodeId === nodeId) {
        found = child;
      }
    });
    if (found) {
      this.select(found);
    }
    return found;
  }

  /**
   * 更新边界框显示
   */
  private updateBoundingBox(): void {
    // 移除旧的边界框
    if (this.boxHelper) {
      this.scene.remove(this.boxHelper);
      this.boxHelper.dispose();
      this.boxHelper = null;
    }

    // 如果有选中对象且需要显示边界框
    if (this.selected && this.options.showBoundingBox) {
      this.box.setFromObject(this.selected);

      if (!this.box.isEmpty()) {
        this.boxHelper = new BoxHelper(this.selected, this.options.boundingBoxColor);
        this.boxHelper.name = "__selectionBox__";
        this.scene.add(this.boxHelper);
      }
    }
  }

  /**
   * 刷新边界框（当选中对象变换后调用）
   */
  refreshBoundingBox(): void {
    if (this.boxHelper && this.selected) {
      this.boxHelper.update();
    }
  }

  /**
   * 添加选择变化监听
   */
  onChange(callback: SelectionChangeCallback): void {
    this.onChangeCallbacks.push(callback);
  }

  /**
   * 移除选择变化监听
   */
  offChange(callback: SelectionChangeCallback): void {
    const index = this.onChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * 获取边界框辅助对象
   */
  getBoxHelper(): BoxHelper | null {
    return this.boxHelper;
  }

  /**
   * 销毁
   */
  dispose(): void {
    if (this.boxHelper) {
      this.scene.remove(this.boxHelper);
      this.boxHelper.dispose();
      this.boxHelper = null;
    }
    this.onChangeCallbacks = [];
    this.selected = null;
  }
}
