// 获取元素 入参可能是个字符串也可能是dom元素
export const getElement = (element: string | HTMLElement) => {
  if (typeof element === "string") {
    return document.querySelector(element) as HTMLElement;
  }
  return element;
};
