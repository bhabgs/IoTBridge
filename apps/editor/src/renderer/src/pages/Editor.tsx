import { useEffect, useCallback } from 'react'
import { useEditorStore } from '../hooks/useEditorStore'
import { PixiCanvas } from '../components/PixiCanvas'
import { Toolbar } from '../components/Toolbar'
import { PropertyPanel } from '../components/PropertyPanel'

export function Editor(): React.JSX.Element {
  const store = useEditorStore()

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
        alert('Failed to import JSON. Please check the file format.')
      }
    },
    [store]
  )

  useEffect(() => {
    window.addEventListener('editor-import', handleImportEvent)
    return () => {
      window.removeEventListener('editor-import', handleImportEvent)
    }
  }, [handleImportEvent])

  return (
    <div className="editor-container">
      <Toolbar
        onAddRect={store.addRect}
        onAddText={store.addText}
        onDelete={store.deleteSelected}
        onExport={handleExport}
        onImport={() => {}}
        onGroup={store.groupSelected}
        onUngroup={store.ungroupSelected}
        hasSelection={store.selectedIds.size > 0}
        canGroup={store.canGroup()}
        canUngroup={store.canUngroup()}
      />
      <div className="canvas-container">
        <PixiCanvas
          elements={store.elements}
          selectedIds={store.selectedIds}
          onSelect={store.selectElement}
          onSelectMultiple={store.selectElements}
          onUpdateElement={store.updateElement}
        />
      </div>
      <PropertyPanel elements={store.getSelectedElements()} onUpdate={store.updateElement} />
    </div>
  )
}
