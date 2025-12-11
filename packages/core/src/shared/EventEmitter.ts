/**
 * @fileoverview 类型安全的事件发射器
 */

type EventCallback<T = any> = (data: T) => void;

/**
 * 通用事件发射器
 * 提供类型安全的事件订阅和发布功能
 */
export class EventEmitter<EventMap extends Record<string, any> = Record<string, any>> {
  private listeners: Map<keyof EventMap, Set<EventCallback>> = new Map();

  /**
   * 订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   * @returns 取消订阅的函数
   */
  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 订阅一次性事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  once<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    const wrapper: EventCallback<EventMap[K]> = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  /**
   * 取消订阅
   * @param event 事件名称
   * @param callback 回调函数
   */
  off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * 发射事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for "${String(event)}":`, error);
        }
      });
    }
  }

  /**
   * 移除指定事件的所有监听器
   * @param event 事件名称（可选，不传则移除所有）
   */
  removeAllListeners<K extends keyof EventMap>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 获取指定事件的监听器数量
   */
  listenerCount<K extends keyof EventMap>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * 销毁，清理所有监听器
   */
  dispose(): void {
    this.listeners.clear();
  }
}
