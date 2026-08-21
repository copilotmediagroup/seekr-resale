import type { Hunter } from '../../domain/hunters/Hunter'

interface HunterListPanelProps {
  hunters: Hunter[]
  selectedId: string | null
  draggedHunterId: string | null
  dragOverHunterId: string | null
  onCreate: () => void
  onSelect: (id: string) => void
  onMoveOver: (id: string) => void
  onDrop: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onToggleEnabled: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
}

export function HunterListPanel({
  hunters,
  selectedId,
  draggedHunterId,
  dragOverHunterId,
  onCreate,
  onSelect,
  onMoveOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onToggleEnabled,
  onDuplicate,
  onRemove,
}: HunterListPanelProps) {
  return (
    <aside className="hunterListPanel">
      <div className="panelHeader">
        <div>
          <span className="panelEyebrow">YOUR HUNTERS</span>
          <strong>{hunters.length}</strong>
        </div>

        <button
          className="newHunterButton"
          onClick={onCreate}
          type="button"
        >
          <span>+</span>
          New Hunter
        </button>
      </div>

      <div className="hunterList">
        {hunters.map((hunter) => (
          <div
            className={`hunterCard ${
              selectedId === hunter.id ? 'hunterCardActive' : ''
            } ${
              draggedHunterId === hunter.id ? 'hunterCardDragging' : ''
            } ${
              dragOverHunterId === hunter.id ? 'hunterCardDragTarget' : ''
            }`}
            key={hunter.id}
            onDragOver={(event) => {
              event.preventDefault()
              onMoveOver(hunter.id)
            }}
            onDrop={(event) => {
              event.preventDefault()
              onDrop(hunter.id)
            }}
          >
            {hunters.length > 1 && (
              <button
                aria-label={`Reorder ${hunter.name || 'Hunter'}`}
                className="hunterDragHandle"
                draggable
                onClick={(event) => event.stopPropagation()}
                onDragEnd={onDragEnd}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', hunter.id)
                  onDragStart(hunter.id)
                }}
                title="Drag to reorder"
                type="button"
              >
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </button>
            )}

            <button
              className="hunterCardSelect hunterCardSelectWithManagementActions"
              onClick={() => onSelect(hunter.id)}
              type="button"
            >
              <div className="hunterCardMain">
                <span className="hunterCardName">
                  {hunter.name || 'Untitled Hunter'}
                </span>

                <span className="hunterCardMeta">
                  {hunter.location.postalCode || 'Location not set'}
                  {' · '}
                  {hunter.location.radiusMiles === null
                    ? 'Any radius'
                    : `${hunter.location.radiusMiles} mi`}
                </span>
              </div>
            </button>

            <button
              aria-label={
                hunter.enabled
                  ? `Pause ${hunter.name || 'Hunter'}`
                  : `Activate ${hunter.name || 'Hunter'}`
              }
              aria-pressed={hunter.enabled}
              className={`hunterStateButton ${
                hunter.enabled ? 'hunterStateButtonEnabled' : ''
              }`}
              onClick={() => onToggleEnabled(hunter.id)}
              title={hunter.enabled ? 'Pause Hunter' : 'Activate Hunter'}
              type="button"
            >
              <span className="hunterStateButtonDot" />
              <span>{hunter.enabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              aria-label={`Duplicate ${hunter.name || 'Hunter'}`}
              className="hunterDuplicateButton"
              onClick={() => onDuplicate(hunter.id)}
              title="Duplicate Hunter"
              type="button"
            >
              ⧉
            </button>

            {hunters.length > 1 && (
              <button
                aria-label={`Remove ${hunter.name || 'Hunter'}`}
                className="hunterRemoveButton"
                onClick={() => onRemove(hunter.id)}
                title="Remove Hunter"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="listFooter">
        Create separate Hunters for different markets, categories, locations,
        and resale strategies.
      </div>
    </aside>
  )
}
