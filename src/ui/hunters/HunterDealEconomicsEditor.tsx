import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import type {
  ListingEconomicsPort,
  ListingEconomicsValues,
} from '../../application/hunters/listingEconomicsPort'

interface HunterDealEconomicsEditorProps {
  listingId: string
  economics: ListingEconomicsPort
  isEvaluating: boolean
  onSaved: () => Promise<void>
}

type EditableEconomicsField =
  | 'expectedPurchasePrice'
  | 'estimatedRepairCost'
  | 'estimatedTransportCost'
  | 'estimatedTaxesAndRegistration'
  | 'estimatedTransactionFees'
  | 'estimatedOtherCosts'

type EconomicsDraft = Record<
  EditableEconomicsField,
  string
>

const EMPTY_DRAFT: EconomicsDraft = {
  expectedPurchasePrice: '',
  estimatedRepairCost: '',
  estimatedTransportCost: '',
  estimatedTaxesAndRegistration: '',
  estimatedTransactionFees: '',
  estimatedOtherCosts: '',
}

const FIELD_CONFIG: Array<{
  field: EditableEconomicsField
  label: string
  placeholder: string
}> = [
  {
    field: 'expectedPurchasePrice',
    label: 'Expected Purchase',
    placeholder: 'Negotiated buy price',
  },
  {
    field: 'estimatedRepairCost',
    label: 'Repairs',
    placeholder: 'Repair budget',
  },
  {
    field: 'estimatedTransportCost',
    label: 'Transport',
    placeholder: 'Pickup / delivery',
  },
  {
    field: 'estimatedTaxesAndRegistration',
    label: 'Taxes + Registration',
    placeholder: 'Taxes / title / registration',
  },
  {
    field: 'estimatedTransactionFees',
    label: 'Transaction Fees',
    placeholder: 'Marketplace / payment fees',
  },
  {
    field: 'estimatedOtherCosts',
    label: 'Other Costs',
    placeholder: 'Detailing / misc.',
  },
]

const toDraft = (
  values: ListingEconomicsValues,
): EconomicsDraft => ({
  expectedPurchasePrice:
    values.expectedPurchasePrice?.toString() ?? '',
  estimatedRepairCost:
    values.estimatedRepairCost?.toString() ?? '',
  estimatedTransportCost:
    values.estimatedTransportCost?.toString() ?? '',
  estimatedTaxesAndRegistration:
    values.estimatedTaxesAndRegistration?.toString() ?? '',
  estimatedTransactionFees:
    values.estimatedTransactionFees?.toString() ?? '',
  estimatedOtherCosts:
    values.estimatedOtherCosts?.toString() ?? '',
})

export function HunterDealEconomicsEditor({
  listingId,
  economics,
  isEvaluating,
  onSaved,
}: HunterDealEconomicsEditorProps) {
  const [draft, setDraft] =
    useState<EconomicsDraft>(EMPTY_DRAFT)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setMessage('')

    void economics
      .getListingEconomics(listingId)
      .then((values) => {
        if (!cancelled) {
          setDraft(toDraft(values))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMessage(
            'Unable to load saved deal economics.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [economics, listingId])

  const updateField = (
    field: EditableEconomicsField,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const save = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (isSaving || isEvaluating) {
      return
    }

    const values: ListingEconomicsValues = {}

    for (const { field } of FIELD_CONFIG) {
      const raw = draft[field].trim()

      if (raw === '') {
        continue
      }

      const amount = Number(raw)

      if (
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        setMessage(
          'Deal economics must be valid amounts of zero or more.',
        )
        return
      }

      values[field] = amount
    }

    setIsSaving(true)
    setMessage('')

    try {
      await economics.saveListingEconomics(
        listingId,
        values,
      )

      setMessage(
        'Saved. Recalculating this Hunter...',
      )

      await onSaved()
    } catch {
      setMessage(
        'Unable to save deal economics.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      className="dealEconomicsEditor"
      onSubmit={(event) => void save(event)}
    >
      <div className="dealEconomicsHeader">
        <div>
          <span>DEAL ECONOMICS</span>
          <strong>
            Use your numbers when you know them
          </strong>
        </div>

        <span className="dealEconomicsOptional">
          USER CONTROLLED
        </span>
      </div>

      <p className="dealEconomicsHelp">
        Leave any field blank and SEEKR will estimate it
        when reliable evidence is available.
      </p>

      <div className="dealEconomicsGrid">
        {FIELD_CONFIG.map(
          ({ field, label, placeholder }) => (
            <label key={field}>
              <span>{label}</span>

              <div className="dealEconomicsMoneyInput">
                <span>$</span>
                <input
                  disabled={
                    isLoading ||
                    isSaving ||
                    isEvaluating
                  }
                  inputMode="decimal"
                  min="0"
                  placeholder={placeholder}
                  step="0.01"
                  type="number"
                  value={draft[field]}
                  onChange={(event) =>
                    updateField(
                      field,
                      event.target.value,
                    )
                  }
                />
              </div>
            </label>
          ),
        )}
      </div>

      <div className="dealEconomicsActions">
        <span className="dealEconomicsMessage">
          {message}
        </span>

        <button
          className="secondaryActionButton"
          disabled={
            isLoading ||
            isSaving ||
            isEvaluating
          }
          type="submit"
        >
          {isSaving
            ? 'Saving...'
            : 'Save & Recalculate'}
        </button>
      </div>
    </form>
  )
}
