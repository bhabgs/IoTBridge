/**
 * @fileoverview 路径工具函数 - 处理嵌套属性路径
 */

/**
 * 从数据路径获取值
 * @param obj 对象
 * @param path 路径，如 "transform.position.x"
 */
export function getValueByPath(obj: any, path: string): any {
  const keys = path.split('.')
  let value = obj
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key]
    } else {
      return undefined
    }
  }
  return value
}

/**
 * 通过数据路径设置值
 * @param obj 对象
 * @param path 路径，如 "transform.position.x"
 * @param value 值
 */
export function setValueByPath(obj: any, path: string, value: any): any {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  let target = obj

  for (const key of keys) {
    if (!(key in target)) {
      target[key] = {}
    }
    target = target[key]
  }

  target[lastKey] = value
  return obj
}
