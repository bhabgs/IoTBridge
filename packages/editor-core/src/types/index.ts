import { Cpd } from "types";

/**
 * 编辑器模式类型
 * - edit: 编辑模式
 * - preview: 预览模式
 */
export type EditorMode = "edit" | "preview";

/**
 * 编辑器核心选项
 */
export interface EditorCoreOptions {
  container: HTMLElement | string;
  data?: Cpd; // 数据
  options?: {
    mode?: EditorMode; // 编辑器模式 默认编辑模式
    // 是否开启3D模式
    is3D?: boolean; // 是否开启3D模式 默认关闭
  };
}
