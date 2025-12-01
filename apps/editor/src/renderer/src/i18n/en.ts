import type { Translations } from './zh'

export const en: Translations = {
  toolbar: {
    title: 'Tools',
    addElements: 'Add Elements',
    addRect: 'Rectangle',
    addCircle: 'Circle',
    addEllipse: 'Ellipse',
    addTriangle: 'Triangle',
    addDiamond: 'Diamond',
    addLine: 'Line',
    addText: 'Text',
    addPipe: 'Pipe',
    drawingPipe: 'Drawing...',
    group: 'Group',
    groupBtn: 'Group',
    ungroupBtn: 'Ungroup',
    actions: 'Actions',
    deleteSelected: 'Delete Selected',
    file: 'File',
    exportJSON: 'Export JSON',
    importJSON: 'Import JSON'
  },
  properties: {
    title: 'Properties',
    noSelection: 'No element selected',
    multiSelection: '{count} elements selected',
    id: 'ID',
    type: 'Type',
    position: 'Position & Size',
    x: 'X',
    y: 'Y',
    width: 'Width',
    height: 'Height',
    style: 'Style',
    fillColor: 'Fill Color',
    strokeColor: 'Stroke Color',
    strokeWidth: 'Stroke Width',
    opacity: 'Opacity',
    textSettings: 'Text Settings',
    text: 'Text',
    fontSize: 'Font Size',
    pipeSettings: 'Pipe Settings',
    pipeWidth: 'Pipe Width'
  },
  types: {
    rect: 'Rectangle',
    circle: 'Circle',
    ellipse: 'Ellipse',
    triangle: 'Triangle',
    diamond: 'Diamond',
    line: 'Line',
    pipe: 'Pipe',
    text: 'Text',
    group: 'Group'
  },
  language: {
    title: 'Language',
    zh: '中文',
    en: 'English',
    ar: 'العربية'
  },
  importError: 'Failed to import JSON. Please check the file format.'
}
