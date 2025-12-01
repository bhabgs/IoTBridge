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

  const handleChange = (field: keyof EditorElement, value: string | number): void => {
    if (field === 'text' || field === 'fillColor' || field === 'strokeColor') {
      onUpdate(element.id, { [field]: value })
    } else if (field === 'x' || field === 'y' || field === 'width' || field === 'height' || field === 'strokeWidth' || field === 'fontSize' || field === 'pipeWidth') {
      const numValue = typeof value === 'number' ? value : parseInt(value, 10)
      if (!isNaN(numValue) && numValue >= 0) {
        onUpdate(element.id, { [field]: numValue })
      }
    } else if (field === 'opacity') {
      const numValue = typeof value === 'number' ? value : parseFloat(value)
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
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

      <div className="property-section">
        <h4 className="property-section-title">{t.properties.position}</h4>
        <div className="property-row">
          <div className="property-group half">
            <label className="property-label">{t.properties.x}</label>
            <input
              type="number"
              className="property-input"
              value={element.x}
              onChange={(e) => handleChange('x', e.target.value)}
            />
          </div>
          <div className="property-group half">
            <label className="property-label">{t.properties.y}</label>
            <input
              type="number"
              className="property-input"
              value={element.y}
              onChange={(e) => handleChange('y', e.target.value)}
            />
          </div>
        </div>
        <div className="property-row">
          <div className="property-group half">
            <label className="property-label">{t.properties.width}</label>
            <input
              type="number"
              className="property-input"
              value={element.width}
              onChange={(e) => handleChange('width', e.target.value)}
              min={1}
            />
          </div>
          <div className="property-group half">
            <label className="property-label">{t.properties.height}</label>
            <input
              type="number"
              className="property-input"
              value={element.height}
              onChange={(e) => handleChange('height', e.target.value)}
              min={1}
            />
          </div>
        </div>
      </div>

      {element.type !== 'group' && (
        <div className="property-section">
          <h4 className="property-section-title">{t.properties.style}</h4>
          {element.type !== 'line' && (
            <div className="property-group">
              <label className="property-label">{t.properties.fillColor}</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  className="color-input"
                  value={element.fillColor || '#4a90d9'}
                  onChange={(e) => handleChange('fillColor', e.target.value)}
                />
                <input
                  type="text"
                  className="property-input color-text"
                  value={element.fillColor || '#4a90d9'}
                  onChange={(e) => handleChange('fillColor', e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="property-group">
            <label className="property-label">{t.properties.strokeColor}</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                className="color-input"
                value={element.strokeColor || '#2c5282'}
                onChange={(e) => handleChange('strokeColor', e.target.value)}
              />
              <input
                type="text"
                className="property-input color-text"
                value={element.strokeColor || '#2c5282'}
                onChange={(e) => handleChange('strokeColor', e.target.value)}
              />
            </div>
          </div>
          <div className="property-row">
            <div className="property-group half">
              <label className="property-label">{t.properties.strokeWidth}</label>
              <input
                type="number"
                className="property-input"
                value={element.strokeWidth ?? 1}
                onChange={(e) => handleChange('strokeWidth', e.target.value)}
                min={0}
                max={20}
              />
            </div>
            <div className="property-group half">
              <label className="property-label">{t.properties.opacity}</label>
              <input
                type="number"
                className="property-input"
                value={element.opacity ?? 1}
                onChange={(e) => handleChange('opacity', e.target.value)}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          </div>
        </div>
      )}

      {element.type === 'text' && (
        <div className="property-section">
          <h4 className="property-section-title">{t.properties.textSettings}</h4>
          <div className="property-group">
            <label className="property-label">{t.properties.text}</label>
            <input
              type="text"
              className="property-input"
              value={element.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
            />
          </div>
          <div className="property-group">
            <label className="property-label">{t.properties.fontSize}</label>
            <input
              type="number"
              className="property-input"
              value={element.fontSize ?? 16}
              onChange={(e) => handleChange('fontSize', e.target.value)}
              min={8}
              max={72}
            />
          </div>
        </div>
      )}

      {element.type === 'pipe' && (
        <div className="property-section">
          <h4 className="property-section-title">{t.properties.pipeSettings}</h4>
          <div className="property-group">
            <label className="property-label">{t.properties.pipeWidth}</label>
            <input
              type="number"
              className="property-input"
              value={element.pipeWidth ?? 8}
              onChange={(e) => handleChange('pipeWidth', e.target.value)}
              min={2}
              max={50}
            />
          </div>
        </div>
      )}
    </div>
  )
}
