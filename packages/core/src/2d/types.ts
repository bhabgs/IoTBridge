import type { SceneModel } from "../types";

/** Pixi2D 构造参数 */
export interface Pixi2DOptions {
  container: HTMLElement;
  sceneModel: SceneModel;
  /** 背景颜色 */
  backgroundColor?: string | number;
  /** 是否自动调整大小 */
  autoResize?: boolean;
}

/** 变换模式 */
export type TransformMode2D = "translate" | "rotate" | "scale";

/** 变换事件 */
export interface TransformChangeEvent2D {
  object: any;
  mode: TransformMode2D;
  position?: { x: number; y: number };
  rotation?: number;
  scale?: { x: number; y: number };
}
