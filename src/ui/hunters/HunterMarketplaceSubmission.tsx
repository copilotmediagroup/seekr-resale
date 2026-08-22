import { useState } from 'react'
import type { MarketplaceSource } from '../../domain/hunters/Hunter'
import type { HunterAcquisitionPort } from '../../application/hunters/hunterAcquisitionPort'

interface HunterMarketplaceSubmissionProps {
  hunterId: string
  sources: MarketplaceSource[]
  acquisition: HunterAcquisitionPort
  onSubmitted: (message: string) => void
  onError: (message: string) => void
}

const sourceName = (source: MarketplaceSource): string => {
  switch (source) {
    case 'facebook_marketplace':
      return 'Facebook Marketplace'
    case 'craigslist':
      return 'Craigslist'
    default:
      return source
  }
}

const createSourceListingId = (
  source: MarketplaceSource,
): string =>
  `${source}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`

export function HunterMarketplaceSubmission({
  hunterId,
  sources,
  acquisition,
  onSubmitted,
  onError,
}: HunterMarketplaceSubmissionProps) {
  const [source, setSource] =
    useState<MarketplaceSource>(
      sources[0] ?? 'facebook_marketplace',
    )
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [askingPrice, setAskingPrice] = useState('')
  const [locationText, setLocationText] = useState('')
  const [postedAt, setPostedAt] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleTrim, setVehicleTrim] = useState('')
  const [vehicleMileage, setVehicleMileage] = useState('')
  const [vehicleVin, setVehicleVin] = useState('')
  const [vehicleCondition, setVehicleCondition] = useState('')

  const availableSources =
    sources.length > 0
      ? sources
      : ([
          'facebook_marketplace',
          'craigslist',
        ] as MarketplaceSource[])

  const submit = () => {
    const trimmedUrl = url.trim()
    const trimmedTitle = title.trim()

    if (!trimmedUrl) {
      onError('Listing URL is required')
      return
    }

    if (!trimmedTitle) {
      onError('Listing title is required')
      return
    }

    const parsedPrice =
      askingPrice.trim() === ''
        ? null
        : Number(askingPrice)

    if (
      parsedPrice !== null &&
      (!Number.isFinite(parsedPrice) ||
        parsedPrice < 0)
    ) {
      onError('Asking price must be a valid amount')
      return
    }

    const parsedYear =
      vehicleYear.trim() === ''
        ? null
        : Number(vehicleYear)

    if (
      parsedYear !== null &&
      (!Number.isInteger(parsedYear) ||
        parsedYear < 1886 ||
        parsedYear > new Date().getFullYear() + 1)
    ) {
      onError('Vehicle year must be valid')
      return
    }

    const parsedMileage =
      vehicleMileage.trim() === ''
        ? null
        : Number(vehicleMileage)

    if (
      parsedMileage !== null &&
      (!Number.isFinite(parsedMileage) ||
        parsedMileage < 0)
    ) {
      onError('Vehicle mileage must be valid')
      return
    }

    const hasVehicleIdentity =
      parsedYear !== null ||
      vehicleMake.trim() !== '' ||
      vehicleModel.trim() !== '' ||
      vehicleTrim.trim() !== '' ||
      parsedMileage !== null ||
      vehicleVin.trim() !== '' ||
      vehicleCondition.trim() !== ''

    acquisition.submitMarketplaceListings(
      hunterId,
      {
        source,
        listings: [
          {
            sourceListingId:
              createSourceListingId(source),
            url: trimmedUrl,
            title: trimmedTitle,
            description:
              description.trim() || null,
            askingPrice: parsedPrice,
            locationText:
              locationText.trim() || null,
            postedAt:
              postedAt.trim() || null,
            vehicle: hasVehicleIdentity
              ? {
                  year: parsedYear,
                  make: vehicleMake.trim() || null,
                  model: vehicleModel.trim() || null,
                  trim: vehicleTrim.trim() || null,
                  mileage: parsedMileage,
                  vin: vehicleVin.trim() || null,
                  condition:
                    vehicleCondition.trim() || null,
                }
              : null,
          },
        ],
      },
    )

    setUrl('')
    setTitle('')
    setDescription('')
    setAskingPrice('')
    setLocationText('')
    setPostedAt('')
    setVehicleYear('')
    setVehicleMake('')
    setVehicleModel('')
    setVehicleTrim('')
    setVehicleMileage('')
    setVehicleVin('')
    setVehicleCondition('')

    onSubmitted(
      `${sourceName(source)} listing added to this Hunter`,
    )
  }

  return (
    <section className="marketplaceSubmissionPanel">
      <div className="marketplaceSubmissionHeader">
        <div>
          <div className="eyebrow">
            MARKETPLACE ACQUISITION
          </div>
          <h2>Add Marketplace Listing</h2>
          <p>
            Add a listing you found so SEEKR can run it
            through Hunter intelligence.
          </p>
        </div>
      </div>

      <div className="marketplaceSubmissionGrid">
        <label>
          <span>MARKETPLACE</span>
          <select
            value={source}
            onChange={(event) =>
              setSource(
                event.target
                  .value as MarketplaceSource,
              )
            }
          >
            {availableSources.map(
              (marketplace) => (
                <option
                  key={marketplace}
                  value={marketplace}
                >
                  {sourceName(marketplace)}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>ASKING PRICE</span>
          <input
            inputMode="decimal"
            placeholder="2900"
            type="number"
            min="0"
            value={askingPrice}
            onChange={(event) =>
              setAskingPrice(event.target.value)
            }
          />
        </label>

        <label className="marketplaceSubmissionWide">
          <span>LISTING TITLE</span>
          <input
            placeholder="2008 Mazda3"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />
        </label>

        <label className="marketplaceSubmissionWide">
          <span>LISTING URL</span>
          <input
            placeholder="https://..."
            type="url"
            value={url}
            onChange={(event) =>
              setUrl(event.target.value)
            }
          />
        </label>

        <label>
          <span>LOCATION</span>
          <input
            placeholder="Tampa, FL"
            value={locationText}
            onChange={(event) =>
              setLocationText(event.target.value)
            }
          />
        </label>

        <label>
          <span>POSTED AT</span>
          <input
            placeholder="2026-08-21T18:00:00.000Z"
            value={postedAt}
            onChange={(event) =>
              setPostedAt(event.target.value)
            }
          />
        </label>

        <div className="marketplaceVehicleSection marketplaceSubmissionWide">
          <div className="marketplaceVehicleHeader">
            <div>
              <span className="marketplaceVehicleEyebrow">
                VEHICLE DETAILS
              </span>
              <strong>
                Help SEEKR find accurate market comparables
              </strong>
            </div>
            <span>OPTIONAL</span>
          </div>

          <div className="marketplaceVehicleGrid">
            <label>
              <span>YEAR</span>
              <input
                inputMode="numeric"
                placeholder="2008"
                type="number"
                value={vehicleYear}
                onChange={(event) =>
                  setVehicleYear(event.target.value)
                }
              />
            </label>

            <label>
              <span>MAKE</span>
              <input
                placeholder="Mazda"
                value={vehicleMake}
                onChange={(event) =>
                  setVehicleMake(event.target.value)
                }
              />
            </label>

            <label>
              <span>MODEL</span>
              <input
                placeholder="Mazda3"
                value={vehicleModel}
                onChange={(event) =>
                  setVehicleModel(event.target.value)
                }
              />
            </label>

            <label>
              <span>TRIM</span>
              <input
                placeholder="i Touring"
                value={vehicleTrim}
                onChange={(event) =>
                  setVehicleTrim(event.target.value)
                }
              />
            </label>

            <label>
              <span>MILEAGE</span>
              <input
                inputMode="numeric"
                placeholder="126000"
                type="number"
                min="0"
                value={vehicleMileage}
                onChange={(event) =>
                  setVehicleMileage(event.target.value)
                }
              />
            </label>

            <label>
              <span>CONDITION</span>
              <input
                placeholder="Good"
                value={vehicleCondition}
                onChange={(event) =>
                  setVehicleCondition(event.target.value)
                }
              />
            </label>

            <label className="marketplaceVehicleVin">
              <span>VIN</span>
              <input
                placeholder="Optional VIN"
                value={vehicleVin}
                onChange={(event) =>
                  setVehicleVin(event.target.value)
                }
              />
            </label>
          </div>
        </div>

        <label className="marketplaceSubmissionWide">
          <span>DESCRIPTION</span>
          <textarea
            placeholder="Runs and drives..."
            rows={3}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
          />
        </label>
      </div>

      <div className="marketplaceSubmissionActions">
        <button
          className="secondaryButton"
          onClick={submit}
          type="button"
        >
          Add Listing to Hunter
        </button>
      </div>
    </section>
  )
}
