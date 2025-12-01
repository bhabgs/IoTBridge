import { useI18n, type Language } from '../i18n'
import type { ElementType } from '../types/element'

interface ToolbarProps {
  onDelete: () => void
  onExport: () => void
  onImport: () => void
  onGroup: () => void
  onUngroup: () => void
  hasSelection: boolean
  canGroup: boolean
  canUngroup: boolean
  drawingMode: 'none' | 'pipe'
  onToggleDrawingMode: (mode: 'none' | 'pipe') => void
}

export function Toolbar({
  onDelete,
  onExport,
  onImport,
  onGroup,
  onUngroup,
  hasSelection,
  canGroup,
  canUngroup,
  drawingMode,
  onToggleDrawingMode
}: ToolbarProps): React.JSX.Element {
  const { t, language, setLanguage } = useI18n()

  const handleDragStart = (e: React.DragEvent, type: ElementType): void => {
    e.dataTransfer.setData('element-type', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleImportClick = (): void => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e): Promise<void> => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        onImport()
        window.dispatchEvent(new CustomEvent('editor-import', { detail: text }))
      }
    }
    input.click()
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setLanguage(e.target.value as Language)
  }

  return (
    <div className="toolbar">
      <h3>{t.toolbar.title}</h3>
      <div className="toolbar-section">
        <h4>{t.toolbar.addElements}</h4>
        <div className="draggable-grid">
          <div
            className="draggable-item"
            draggable
            onDragStart={(e) => handleDragStart(e, 'rect')}
            title={t.toolbar.addRect}
          >
            <div className="draggable-icon rect-icon" />
          </div>
          <div
            className="draggable-item"
            draggable
            onDragStart={(e) => handleDragStart(e, 'circle')}
            title={t.toolbar.addCircle}
          >
            <div className="draggable-icon circle-icon" />
          </div>
          <div
            className="draggable-item"
            draggable
            onDragStart={(e) => handleDragStart(e, 'ellipse')}
            title={t.toolbar.addEllipse}
          >
            <div className="draggable-icon ellipse-icon" />
          </div>
          <div
            className="draggable-item"
            draggable
            onDragStart={(e) => handleDragStart(e, 'triangle')}
            title={t.toolbar.addTriangle}
          >
            <div className="draggable-icon triangle-icon" />
          </div>
          <div
            className="draggable-item"
            draggable
            onDragStart={(e) => handleDragStart(e, 'diamond')}
            title={t.toolbar.addDiamond}
          >
            <div className="draggable-icon diamond-icon" />
          </div>
          <div
            className="draggable-item"
            draggable
            onDragStart={(e) => handleDragStart(e, 'line')}
            title={t.toolbar.addLine}
          >
            <div className="draggable-icon line-icon" />
          </div>
          <div
            className="draggable-item"
            draggable
            onDragStart={(e) => handleDragStart(e, 'text')}
            title={t.toolbar.addText}
          >
            <div className="draggable-icon text-icon" />
          </div>
        </div>
        <button
          className={`toolbar-btn pipe-btn ${drawingMode === 'pipe' ? 'active' : ''}`}
          onClick={() => onToggleDrawingMode(drawingMode === 'pipe' ? 'none' : 'pipe')}
          title={t.toolbar.addPipe}
        >
          {drawingMode === 'pipe' ? t.toolbar.drawingPipe : t.toolbar.addPipe}
        </button>
      </div>
      <div className="toolbar-section">
        <h4>{t.toolbar.group}</h4>
        <button className="toolbar-btn" onClick={onGroup} disabled={!canGroup}>
          {t.toolbar.groupBtn}
        </button>
        <button className="toolbar-btn" onClick={onUngroup} disabled={!canUngroup}>
          {t.toolbar.ungroupBtn}
        </button>
      </div>
      <div className="toolbar-section">
        <h4>{t.toolbar.actions}</h4>
        <button
          className="toolbar-btn toolbar-btn-danger"
          onClick={onDelete}
          disabled={!hasSelection}
        >
          {t.toolbar.deleteSelected}
        </button>
      </div>
      <div className="toolbar-section">
        <h4>{t.toolbar.file}</h4>
        <button className="toolbar-btn" onClick={onExport}>
          {t.toolbar.exportJSON}
        </button>
        <button className="toolbar-btn" onClick={handleImportClick}>
          {t.toolbar.importJSON}
        </button>
      </div>
      <div className="toolbar-section">
        <h4>{t.language.title}</h4>
        <select className="language-select" value={language} onChange={handleLanguageChange}>
          <option value="zh">{t.language.zh}</option>
          <option value="en">{t.language.en}</option>
          <option value="ar">{t.language.ar}</option>
        </select>
      </div>
    </div>
  )
}
