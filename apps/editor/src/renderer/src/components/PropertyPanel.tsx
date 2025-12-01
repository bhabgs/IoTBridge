import type { EditorElement } from '../types/element'
import { useI18n } from '../i18n'

interface PropertyPanelProps {
  elements: EditorElement[]
  onUpdate: (id: string, updates: Partial<EditorElement>) => void
}

export function PropertyPanel({ elements, onUpdate }: PropertyPanelProps): React.JSX.Element {
  const { t } = useI18n()

  if (elements.length === 0) {
    return (
      <div className="property-panel">
        <h3>{t.properties.title}</h3>
        <p className="no-selection">{t.properties.noSelection}</p>
      </div>
    )
  }

  if (elements.length > 1) {
    return (
      <div className="property-panel">
        <h3>{t.properties.title}</h3>
        <p className="multi-selection">
          {t.properties.multiSelection.replace('{count}', String(elements.length))}
        </p>
        <div className="selected-list">
          {elements.map((el) => (
            <div key={el.id} className="selected-item">
              <span className="item-type">{t.types[el.type]}</span>
              <span className="item-id">{el.id.slice(-8)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const element = elements[0]

  const handleChange = (field: keyof EditorElement, value: string): void => {
    if (field === 'text') {
      onUpdate(element.id, { [field]: value })
    } else if (field === 'x' || field === 'y' || field === 'width' || field === 'height') {
      const numValue = parseInt(value, 10)
      if (!isNaN(numValue) && numValue >= 0) {
        onUpdate(element.id, { [field]: numValue })
      }
    }
  }

  return (
    <div className="property-panel">
      <h3>{t.properties.title}</h3>
      <div className="property-info">
        <span className="property-label">{t.properties.id}:</span>
        <span className="property-value">{element.id}</span>
      </div>
      <div className="property-info">
        <span className="property-label">{t.properties.type}:</span>
        <span className="property-value">{t.types[element.type]}</span>
      </div>
      <div className="property-group">
        <label className="property-label">{t.properties.x}</label>
        <input
          type="number"
          className="property-input"
          value={element.x}
          onChange={(e) => handleChange('x', e.target.value)}
          min={0}
        />
      </div>
      <div className="property-group">
        <label className="property-label">{t.properties.y}</label>
        <input
          type="number"
          className="property-input"
          value={element.y}
          onChange={(e) => handleChange('y', e.target.value)}
          min={0}
        />
      </div>
      <div className="property-group">
        <label className="property-label">{t.properties.width}</label>
        <input
          type="number"
          className="property-input"
          value={element.width}
          onChange={(e) => handleChange('width', e.target.value)}
          min={1}
        />
      </div>
      <div className="property-group">
        <label className="property-label">{t.properties.height}</label>
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
          <label className="property-label">{t.properties.text}</label>
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
