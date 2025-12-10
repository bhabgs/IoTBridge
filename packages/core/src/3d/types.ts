import type { Object3D } from "three";
import type { SceneModel } from "../types";

/** 变换模式 */
export type TransformMode = "translate" | "rotate" | "scale";

/** Three3D 构造参数 */
export interface Three3DOptions {
  container: HTMLElement;
  sceneModel: SceneModel;
}

/** 选择事件回调 */
export interface SelectionCallbacks {
  onSelect?: (object: Object3D) => void;
  onDeselect?: () => void;
  onDelete?: (object: Object3D) => void;
  onTransformChange?: (object: Object3D) => void;
}
