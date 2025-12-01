export const zh = {
  toolbar: {
    title: '工具',
    addElements: '添加元素',
    addRect: '矩形',
    addCircle: '圆形',
    addEllipse: '椭圆',
    addTriangle: '三角形',
    addDiamond: '菱形',
    addLine: '线条',
    addText: '文本',
    group: '编组',
    groupBtn: '编组',
    ungroupBtn: '取消编组',
    actions: '操作',
    deleteSelected: '删除选中',
    file: '文件',
    exportJSON: '导出 JSON',
    importJSON: '导入 JSON'
  },
  properties: {
    title: '属性',
    noSelection: '未选中元素',
    multiSelection: '{count} 个元素被选中',
    id: 'ID',
    type: '类型',
    x: 'X',
    y: 'Y',
    width: '宽度',
    height: '高度',
    text: '文本'
  },
  types: {
    rect: '矩形',
    circle: '圆形',
    ellipse: '椭圆',
    triangle: '三角形',
    diamond: '菱形',
    line: '线条',
    text: '文本',
    group: '编组'
  },
  language: {
    title: '语言',
    zh: '中文',
    en: 'English',
    ar: 'العربية'
  },
  importError: '导入 JSON 失败，请检查文件格式。'
}

export type Translations = typeof zh
