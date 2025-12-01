import type { EditorElement } from '../types/element'

interface PropertyPanelProps {
  element: EditorElement | undefined
  onUpdate: (updates: Partial<EditorElement>) => void
}

export function PropertyPanel({ element, onUpdate }: PropertyPanelProps): React.JSX.Element {
  if (!element) {
    return (
      <div className="property-panel">
        <h3>Properties</h3>
        <p className="no-selection">No element selected</p>
      </div>
    )
  }

  const handleChange = (field: keyof EditorElement, value: string): void => {
    if (field === 'text') {
      onUpdate({ [field]: value })
    } else if (field === 'x' || field === 'y' || field === 'width' || field === 'height') {
      const numValue = parseInt(value, 10)
      if (!isNaN(numValue) && numValue >= 0) {
        onUpdate({ [field]: numValue })
      }
    }
  }

  return (
    <div className="property-panel">
      <h3>Properties</h3>
      <div className="property-info">
        <span className="property-label">ID:</span>
        <span className="property-value">{element.id}</span>
      </div>
      <div className="property-info">
        <span className="property-label">Type:</span>
        <span className="property-value">{element.type}</span>
      </div>
      <div className="property-group">
        <label className="property-label">X</label>
        <input
          type="number"
          className="property-input"
          value={element.x}
          onChange={(e) => handleChange('x', e.target.value)}
          min={0}
        />
      </div>
      <div className="property-group">
        <label className="property-label">Y</label>
        <input
          type="number"
          className="property-input"
          value={element.y}
          onChange={(e) => handleChange('y', e.target.value)}
          min={0}
        />
      </div>
      <div className="property-group">
        <label className="property-label">Width</label>
        <input
          type="number"
          className="property-input"
          value={element.width}
          onChange={(e) => handleChange('width', e.target.value)}
          min={1}
        />
      </div>
      <div className="property-group">
        <label className="property-label">Height</label>
        <input
          type="number"
          className="property-input"
          value={element.height}
          onChange={(e) => handleChange('height', e.target.value)}
          min={1}
        />
      </div>
      {element.type === 'text' && (
        <div className="property-group">
          <label className="property-label">Text</label>
          <input
            type="text"
            className="property-input"
            value={element.text || ''}
            onChange={(e) => handleChange('text', e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
