import type {
  HunterCategory,
  MarketplaceSource,
} from '../../domain/hunters/Hunter'
import type { HunterService } from '../../application/hunters/hunterService'
import type { HunterIntelligencePort } from '../../application/hunters/hunterIntelligencePort'
import { HunterListPanel } from './HunterListPanel'
import { HunterEditor } from './HunterEditor'
import { HunterWorkspaceFeedback } from './HunterWorkspaceFeedback'
import { HunterOpportunityResults } from './HunterOpportunityResults'
import { useHunterWorkspace } from './useHunterWorkspace'

interface HunterWorkspaceProps {
  service: HunterService
  intelligence: HunterIntelligencePort
}

const MARKETPLACE_OPTIONS: Array<{
  id: MarketplaceSource
  name: string
  description: string
  badge: string
}> = [
  {
    id: 'facebook_marketplace',
    name: 'Facebook Marketplace',
    description: 'Local marketplace listings and seller opportunities.',
    badge: 'FB',
  },
  {
    id: 'craigslist',
    name: 'Craigslist',
    description: 'Local classifieds and direct seller listings.',
    badge: 'CL',
  },
]

const CATEGORY_OPTIONS: Array<{
  id: HunterCategory
  name: string
  description: string
  badge: string
}> = [
  {
    id: 'vehicles',
    name: 'Vehicles',
    description: 'Cars, trucks, vans, motorcycles, and other vehicles.',
    badge: 'VEH',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Phones, computers, gaming, audio, and consumer tech.',
    badge: 'TEC',
  },
  {
    id: 'tools',
    name: 'Tools',
    description: 'Power tools, shop equipment, and professional gear.',
    badge: 'TLS',
  },
  {
    id: 'appliances',
    name: 'Appliances',
    description: 'Washers, dryers, refrigerators, and home appliances.',
    badge: 'APP',
  },
  {
    id: 'furniture',
    name: 'Furniture',
    description: 'Home, office, outdoor, and specialty furniture.',
    badge: 'FUR',
  },
  {
    id: 'collectibles',
    name: 'Collectibles',
    description: 'Trading items, memorabilia, vintage goods, and rarities.',
    badge: 'COL',
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Anything that does not fit the standard categories.',
    badge: 'OTH',
  },
]


export function HunterWorkspace({
  service,
  intelligence,
}: HunterWorkspaceProps) {
  const {
    hunters,
    selectedId,
    draft,
    status,
    draggedHunterId,
    dragOverHunterId,
    pendingSelectionId,
    toast,
    hasUnsavedChanges,
    isEvaluating,
    intelligenceResult,
    selectHunter,
    discardUnsavedChanges,
    keepEditing,
    createNewHunter,
    duplicateHunter,
    removeHunter,
    beginHunterDrag,
    moveHunterOver,
    finishHunterDrop,
    cancelHunterDrag,
    toggleHunterEnabled,
    updateName,
    updateEnabled,
    updatePostalCode,
    updateRadius,
    updateMarketplace,
    updateAllMarketplaces,
    updateCategory,
    updateAllCategories,
    updateThreshold,
    runHunterIntelligence,
    saveHunter,
  } = useHunterWorkspace(service, intelligence)

  return (
    <main className="workspace">
      <HunterWorkspaceFeedback
        onDiscardChanges={discardUnsavedChanges}
        onKeepEditing={keepEditing}
        showUnsavedChanges={pendingSelectionId !== null}
        toast={toast}
      />

      <div className="shell">
        <header className="topbar">
          <div className="brandBlock">
            <div className="brandMark">S</div>
            <div>
              <div className="brand">SEEKR</div>
              <div className="brandSubline">Resale Intelligence</div>
            </div>
          </div>

          <div className="topbarStatus">
            <span className="liveDot" />
            {status}
          </div>
        </header>

        <div className="pageHeading">
          <div>
            <div className="eyebrow">OPPORTUNITY ENGINE</div>
            <h1>Hunters</h1>
            <p>
              Build precise search strategies that continuously look for
              resale opportunities on your terms.
            </p>
          </div>

          <div className="headingMetric">
            <span>ACTIVE HUNTERS</span>
            <strong>
              {hunters.filter((hunter) => hunter.enabled).length}
            </strong>
          </div>
        </div>

        <section className="workspaceGrid">
          <HunterListPanel
            dragOverHunterId={dragOverHunterId}
            draggedHunterId={draggedHunterId}
            hunters={hunters}
            onCreate={() => void createNewHunter()}
            onDragEnd={cancelHunterDrag}
            onDragStart={beginHunterDrag}
            onDrop={(id) => void finishHunterDrop(id)}
            onDuplicate={(id) => void duplicateHunter(id)}
            onMoveOver={moveHunterOver}
            onRemove={(id) => void removeHunter(id)}
            onSelect={(id) => void selectHunter(id)}
            onToggleEnabled={(id) => void toggleHunterEnabled(id)}
            selectedId={selectedId}
          />

          <HunterEditor
            categoryOptions={CATEGORY_OPTIONS}
            draft={draft}
            hasUnsavedChanges={hasUnsavedChanges}
            isEvaluating={isEvaluating}
            marketplaceOptions={MARKETPLACE_OPTIONS}
            onAllCategoriesChange={updateAllCategories}
            onAllMarketplacesChange={updateAllMarketplaces}
            onCategoryChange={updateCategory}
            onEnabledChange={updateEnabled}
            onMarketplaceChange={updateMarketplace}
            onNameChange={updateName}
            onPostalCodeChange={updatePostalCode}
            onRadiusChange={updateRadius}
            onRunIntelligence={runHunterIntelligence}
            onSave={saveHunter}
            onThresholdChange={updateThreshold}
          />
        </section>

        <HunterOpportunityResults
          isEvaluating={isEvaluating}
          result={
            intelligenceResult?.hunterId === draft?.id
              ? intelligenceResult
              : null
          }
        />
      </div>
    </main>
  )
}
