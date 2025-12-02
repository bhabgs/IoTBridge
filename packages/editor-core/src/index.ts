import { Application } from "pixi.js";
import { getElement } from "utils";
import { EditorCoreOptions } from "./types";
import { Cpd } from "types";

const app = new Application();

class EditorCore {
  private _options: EditorCoreOptions;
  private _container: HTMLElement;
  constructor(options: EditorCoreOptions) {
    this._options = options;
    this._container = getElement(options.container);
    this._init();
  }
  // 初始化
  private _init() {
    const { container, data, options } = this._options;
    // 获取container的宽高
    const { width, height } = this._container.getBoundingClientRect();
    // 创建pixi.js的application
    app.init({
      width,
      height,
      background: "#1099bb",
    });
    this._container.appendChild(app.canvas);
    if (!options?.mode || options?.mode === "edit") {
      this._editMode(data);
    } else {
      this._previewMode(data);
    }
  }
  // 重置
  public reset() {}
  // 清空
  public clear() {}
  // 编辑模式
  private _editMode(data?: Cpd) {}
  // 预览模式
  private _previewMode(data?: Cpd) {
    return () => {};
  }
  // 销毁
  public destroy() {}
  // 导出 json
  public exportJson() {}
  // 导出 图片
  public exportImage() {}
  // 获取配置
  public getConfig() {
    return {
      options: this._options.options,
      data: this._options.data,
      container: this._container,
    };
  }
}
export default EditorCore;
