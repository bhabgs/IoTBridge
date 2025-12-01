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

  const handleUpdateSelected = useCallback(
    (updates: Partial<Parameters<typeof store.updateElement>[1]>) => {
      if (store.selectedId) {
        store.updateElement(store.selectedId, updates)
      }
    },
    [store]
  )

  return (
    <div className="editor-container">
      <Toolbar
        onAddRect={store.addRect}
        onAddText={store.addText}
        onDelete={store.deleteSelected}
        onExport={handleExport}
        onImport={() => {}}
        hasSelection={store.selectedId !== null}
      />
      <div className="canvas-container">
        <PixiCanvas
          elements={store.elements}
          selectedId={store.selectedId}
          onSelect={store.selectElement}
          onUpdateElement={store.updateElement}
        />
      </div>
      <PropertyPanel element={store.getSelectedElement()} onUpdate={handleUpdateSelected} />
    </div>
  )
}
