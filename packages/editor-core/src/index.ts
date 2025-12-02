import { EditorCoreOptions } from "./types";

class EditorCore {
  private _options: EditorCoreOptions;
  private container: HTMLElement;
  constructor(options: EditorCoreOptions) {
    this._options = options;
    this._init();
  }
  // 初始化
  private _init() {
    const { container, data, options } = this._options;
    if (typeof container === "string") {
      this.container = document.querySelector(container) as HTMLElement;
    } else {
      this.container = container;
    }
  }
  // 重置
  public reset() {}
  // 清空
  public clear() {}
  // 编辑模式
  private _editMode() {}
  // 预览模式
  private _previewMode() {}
  // 销毁
  public destroy() {}
  // 导出 json
  public exportJson() {}
  // 导出 图片
  public exportImage() {}
}
export default EditorCore;
