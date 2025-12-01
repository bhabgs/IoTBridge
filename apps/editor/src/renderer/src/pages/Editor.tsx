import { useEffect, useCallback, useState } from 'react'
import { useEditorStore } from '../hooks/useEditorStore'
import { PixiCanvas } from '../components/PixiCanvas'
import { Toolbar } from '../components/Toolbar'
import { PropertyPanel } from '../components/PropertyPanel'
import { useI18n } from '../i18n'
import type { ElementType, Point } from '../types/element'

export function Editor(): React.JSX.Element {
  const store = useEditorStore()
  const { t, isRTL } = useI18n()
  const [drawingMode, setDrawingMode] = useState<'none' | 'pipe'>('none')

  const handleExport = useCallback(() => {
    const json = store.exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `editor-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [store])

  const handleImportEvent = useCallback(
    (e: Event) => {
      const customEvent = e as CustomEvent<string>
      const success = store.importJSON(customEvent.detail)
      if (!success) {
        alert(t.importError)
      }
    },
    [store, t]
  )

  const handleDrop = useCallback(
    (type: ElementType, x: number, y: number) => {
      store.addElementAt(type, x, y)
    },
    [store]
  )

  const handlePipeComplete = useCallback(
    (startElementId: string, endElementId: string, points: Point[]) => {
      store.addPipe(startElementId, endElementId, points)
      setDrawingMode('none')
    },
    [store]
  )

  const handleToggleDrawingMode = useCallback((mode: 'none' | 'pipe') => {
    setDrawingMode(mode)
  }, [])

  useEffect(() => {
    window.addEventListener('editor-import', handleImportEvent)
    return () => {
      window.removeEventListener('editor-import', handleImportEvent)
    }
  }, [handleImportEvent])

  return (
    <div className={`editor-container ${isRTL ? 'rtl' : ''}`}>
      <Toolbar
        onDelete={store.deleteSelected}
        onExport={handleExport}
        onImport={() => {}}
        onGroup={store.groupSelected}
        onUngroup={store.ungroupSelected}
        hasSelection={store.selectedIds.size > 0}
        canGroup={store.canGroup()}
        canUngroup={store.canUngroup()}
        drawingMode={drawingMode}
        onToggleDrawingMode={handleToggleDrawingMode}
      />
      <div className="canvas-container">
        <PixiCanvas
          elements={store.elements}
          selectedIds={store.selectedIds}
          onSelect={store.selectElement}
          onSelectMultiple={store.selectElements}
          onUpdateElement={store.updateElement}
          onDropElement={handleDrop}
          drawingMode={drawingMode}
          onPipeComplete={handlePipeComplete}
        />
      </div>
      <PropertyPanel elements={store.getSelectedElements()} onUpdate={store.updateElement} />
    </div>
  )
}
