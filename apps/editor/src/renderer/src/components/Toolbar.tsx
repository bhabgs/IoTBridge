interface ToolbarProps {
  onAddRect: () => void
  onAddText: () => void
  onDelete: () => void
  onExport: () => void
  onImport: () => void
  onGroup: () => void
  onUngroup: () => void
  hasSelection: boolean
  canGroup: boolean
  canUngroup: boolean
}

export function Toolbar({
  onAddRect,
  onAddText,
  onDelete,
  onExport,
  onImport,
  onGroup,
  onUngroup,
  hasSelection,
  canGroup,
  canUngroup
}: ToolbarProps): React.JSX.Element {
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

  return (
    <div className="toolbar">
      <h3>Tools</h3>
      <div className="toolbar-section">
        <h4>Add Elements</h4>
        <button className="toolbar-btn" onClick={onAddRect}>
          + Rectangle
        </button>
        <button className="toolbar-btn" onClick={onAddText}>
          + Text
        </button>
      </div>
      <div className="toolbar-section">
        <h4>Group</h4>
        <button className="toolbar-btn" onClick={onGroup} disabled={!canGroup}>
          Group
        </button>
        <button className="toolbar-btn" onClick={onUngroup} disabled={!canUngroup}>
          Ungroup
        </button>
      </div>
      <div className="toolbar-section">
        <h4>Actions</h4>
        <button
          className="toolbar-btn toolbar-btn-danger"
          onClick={onDelete}
          disabled={!hasSelection}
        >
          Delete Selected
        </button>
      </div>
      <div className="toolbar-section">
        <h4>File</h4>
        <button className="toolbar-btn" onClick={onExport}>
          Export JSON
        </button>
        <button className="toolbar-btn" onClick={handleImportClick}>
          Import JSON
        </button>
      </div>
    </div>
  )
}
