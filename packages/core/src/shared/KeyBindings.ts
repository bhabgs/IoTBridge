/**
 * @fileoverview 键盘快捷键注册表 - 2D/3D 共享的键盘绑定
 */

/**
 * 键盘动作类型
 */
export type KeyAction =
  | 'delete'
  | 'escape'
  | 'togglePan'
  | 'transformTranslate'
  | 'transformRotate'
  | 'transformScale'
  | 'toggleSpace'
  | 'moveForward'
  | 'moveBackward'
  | 'moveLeft'
  | 'moveRight'
  | 'moveUp'
  | 'moveDown'
  | 'rotateLeft'
  | 'rotateRight'
  | 'rotateUp'
  | 'rotateDown';

/**
 * 键盘绑定配置
 */
export interface KeyBinding {
  /** 按键代码（event.code） */
  code?: string;
  /** 按键值（event.key） */
  key?: string;
  /** 是否需要 Ctrl */
  ctrl?: boolean;
  /** 是否需要 Shift */
  shift?: boolean;
  /** 是否需要 Alt */
  alt?: boolean;
  /** 是否需要 Meta (Cmd on Mac) */
  meta?: boolean;
  /** 仅在 keydown 时触发 */
  onKeyDown?: boolean;
  /** 仅在 keyup 时触发 */
  onKeyUp?: boolean;
  /** 是否阻止默认行为 */
  preventDefault?: boolean;
}

/**
 * 默认键盘绑定配置
 */
export const DEFAULT_KEY_BINDINGS: Record<KeyAction, KeyBinding[]> = {
  // 删除
  delete: [
    { key: 'delete', preventDefault: true },
    { key: 'backspace', preventDefault: true },
  ],

  // 取消选择
  escape: [{ key: 'escape' }],

  // 平移模式（空格键）
  togglePan: [{ code: 'space', preventDefault: true }],

  // 变换模式切换
  transformTranslate: [{ key: '1' }],
  transformRotate: [{ key: '2' }],
  transformScale: [{ key: '3' }],

  // 切换变换空间（世界/局部）
  toggleSpace: [{ key: 'x' }],

  // 3D 移动（WASD）
  moveForward: [{ key: 'w', preventDefault: true }],
  moveBackward: [{ key: 's', preventDefault: true }],
  moveLeft: [{ key: 'a', preventDefault: true }],
  moveRight: [{ key: 'd', preventDefault: true }],
  moveUp: [
    { key: 'e', preventDefault: true },
    { code: 'space', preventDefault: true },
  ],
  moveDown: [
    { key: 'q', preventDefault: true },
    { shift: true, preventDefault: true },
  ],

  // 3D 视角旋转（方向键）
  rotateLeft: [{ key: 'arrowleft', preventDefault: true }],
  rotateRight: [{ key: 'arrowright', preventDefault: true }],
  rotateUp: [{ key: 'arrowup', preventDefault: true }],
  rotateDown: [{ key: 'arrowdown', preventDefault: true }],
};

/**
 * 键盘绑定管理器
 */
export class KeyBindingManager {
  private bindings: Map<KeyAction, KeyBinding[]> = new Map();
  private pressedKeys: Set<string> = new Set();

  constructor(customBindings?: Partial<Record<KeyAction, KeyBinding[]>>) {
    // 初始化默认绑定
    for (const [action, bindings] of Object.entries(DEFAULT_KEY_BINDINGS)) {
      this.bindings.set(action as KeyAction, [...bindings]);
    }

    // 应用自定义绑定
    if (customBindings) {
      for (const [action, bindings] of Object.entries(customBindings)) {
        if (bindings) {
          this.bindings.set(action as KeyAction, bindings);
        }
      }
    }
  }

  /**
   * 检查按键事件是否匹配指定动作
   */
  matchAction(event: KeyboardEvent, action: KeyAction): boolean {
    const bindings = this.bindings.get(action);
    if (!bindings) return false;

    return bindings.some((binding) => this.matchBinding(event, binding));
  }

  /**
   * 获取匹配的动作
   */
  getMatchedAction(event: KeyboardEvent): KeyAction | null {
    for (const [action, bindings] of this.bindings) {
      if (bindings.some((binding) => this.matchBinding(event, binding))) {
        return action;
      }
    }
    return null;
  }

  /**
   * 检查按键事件是否匹配绑定配置
   */
  private matchBinding(event: KeyboardEvent, binding: KeyBinding): boolean {
    const key = event.key.toLowerCase();
    const code = event.code.toLowerCase();

    // 匹配按键
    if (binding.code && code !== binding.code.toLowerCase()) return false;
    if (binding.key && key !== binding.key.toLowerCase()) return false;

    // 匹配修饰键
    if (binding.ctrl !== undefined && event.ctrlKey !== binding.ctrl) return false;
    if (binding.shift !== undefined && event.shiftKey !== binding.shift) return false;
    if (binding.alt !== undefined && event.altKey !== binding.alt) return false;
    if (binding.meta !== undefined && event.metaKey !== binding.meta) return false;

    return true;
  }

  /**
   * 记录按键按下
   */
  onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const code = event.code.toLowerCase();

    // 特殊处理空格和 Shift
    if (code === 'space') {
      this.pressedKeys.add(' ');
    } else if (code === 'shiftleft' || code === 'shiftright') {
      this.pressedKeys.add('shift');
    } else {
      this.pressedKeys.add(key);
    }
  }

  /**
   * 记录按键释放
   */
  onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const code = event.code.toLowerCase();

    if (code === 'space') {
      this.pressedKeys.delete(' ');
    } else if (code === 'shiftleft' || code === 'shiftright') {
      this.pressedKeys.delete('shift');
    } else {
      this.pressedKeys.delete(key);
    }
  }

  /**
   * 检查按键是否按下
   */
  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  /**
   * 检查是否有移动键按下
   */
  hasMovementKeys(): boolean {
    return (
      this.isKeyPressed('w') ||
      this.isKeyPressed('a') ||
      this.isKeyPressed('s') ||
      this.isKeyPressed('d') ||
      this.isKeyPressed('q') ||
      this.isKeyPressed('e') ||
      this.isKeyPressed(' ') ||
      this.isKeyPressed('shift')
    );
  }

  /**
   * 检查是否有旋转键按下
   */
  hasRotationKeys(): boolean {
    return (
      this.isKeyPressed('arrowleft') ||
      this.isKeyPressed('arrowright') ||
      this.isKeyPressed('arrowup') ||
      this.isKeyPressed('arrowdown')
    );
  }

  /**
   * 获取按下的按键集合
   */
  getPressedKeys(): Set<string> {
    return new Set(this.pressedKeys);
  }

  /**
   * 清空按下的按键
   */
  clearPressedKeys(): void {
    this.pressedKeys.clear();
  }

  /**
   * 应该阻止默认行为的动作
   */
  shouldPreventDefault(event: KeyboardEvent): boolean {
    const action = this.getMatchedAction(event);
    if (!action) return false;

    const bindings = this.bindings.get(action);
    if (!bindings) return false;

    return bindings.some(
      (binding) => binding.preventDefault && this.matchBinding(event, binding)
    );
  }
}

/**
 * 创建默认的键盘绑定管理器
 */
export function createKeyBindingManager(
  customBindings?: Partial<Record<KeyAction, KeyBinding[]>>
): KeyBindingManager {
  return new KeyBindingManager(customBindings);
}
