import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  listFeatureFlags,
  updateFeatureFlagStatus,
  updateFeatureFlagTraffic,
} from '../actions/featureFlagActions'
import {
  FEATURE_FLAG_UPDATE_STATUS_RESET,
  FEATURE_FLAG_UPDATE_TRAFFIC_RESET,
} from '../constants/featureFlagConstants'
import './FeatureDashboard.css'

/* ── Inline SVG icons (no emoji per anti-slop spec) ──────────── */

const IconSearch = () => (
  <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
    <circle cx='8.5' cy='8.5' r='5.5' />
    <line x1='13' y1='13' x2='17.5' y2='17.5' />
  </svg>
)

const IconEnabledDot = () => (
  <svg viewBox='0 0 12 12' fill='none'>
    <circle cx='6' cy='6' r='6' fill='currentColor' fillOpacity='0.2' />
    <path d='M3.5 6.1L5.2 7.8L8.5 4.5' stroke='currentColor' strokeWidth='1.3' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
)

const IconTestingDot = () => (
  <svg viewBox='0 0 12 12' fill='none'>
    <path d='M6 0a6 6 0 0 1 0 12z' fill='currentColor' />
    <circle cx='6' cy='6' r='5.5' stroke='currentColor' strokeWidth='1' />
  </svg>
)

const IconDisabledDot = () => (
  <svg viewBox='0 0 12 12' fill='none'>
    <circle cx='6' cy='6' r='5.5' stroke='currentColor' strokeWidth='1' />
  </svg>
)

const IconClock = () => (
  <svg viewBox='0 0 12 12' fill='none' stroke='currentColor' strokeWidth='1' strokeLinecap='round'>
    <circle cx='6' cy='6' r='5' />
    <path d='M6 3.5V6L7.5 7.5' />
  </svg>
)

const IconDep = () => (
  <svg viewBox='0 0 12 12' fill='none' stroke='currentColor' strokeWidth='1' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M2 6h8M7 3l3 3-3 3' />
  </svg>
)

const IconEmpty = () => (
  <svg viewBox='0 0 64 64' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
    <rect x='8' y='16' width='48' height='36' rx='3' />
    <path d='M22 28h20M22 36h14' />
    <path d='M20 16V12a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v4' />
  </svg>
)

const IconAlert = () => (
  <svg viewBox='0 0 18 18' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M9 2.5L1.5 15.5h15L9 2.5z' />
    <path d='M9 8v4' />
    <circle cx='9' cy='13.5' r='0.5' fill='currentColor' />
  </svg>
)

const IconCheckCircle = () => (
  <svg viewBox='0 0 18 18' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
    <circle cx='9' cy='9' r='7.5' />
    <path d='M5.5 9L8 11.5L12.5 7' />
  </svg>
)

/* ── StatusBadge component ───────────────────────────────────── */

const BADGE_CONFIG = {
  Enabled: { cls: 'fd-badge--enabled', Icon: IconEnabledDot },
  Testing: { cls: 'fd-badge--testing', Icon: IconTestingDot },
  Disabled: { cls: 'fd-badge--disabled', Icon: IconDisabledDot },
}

const StatusBadge = ({ status }) => {
  const { cls, Icon } = BADGE_CONFIG[status] || BADGE_CONFIG.Disabled
  return (
    <span className={`fd-badge ${cls}`}>
      <span className='fd-badge__icon' aria-hidden='true'>
        <Icon />
      </span>
      {status}
    </span>
  )
}

/* ── Skeleton card (loading placeholder) ─────────────────────── */

const SkeletonCard = () => (
  <div className='fd-skeleton-card' aria-hidden='true'>
    <div className='fd-skeleton-row'>
      <div>
        <div className='fd-skeleton' style={{ width: 80, height: 10, marginBottom: 8 }} />
        <div className='fd-skeleton' style={{ width: 180, height: 20 }} />
      </div>
      <div className='fd-skeleton' style={{ width: 76, height: 24 }} />
    </div>
    <div className='fd-card__divider' />
    <div className='fd-skeleton' style={{ width: '100%', height: 12, marginBottom: 6 }} />
    <div className='fd-skeleton' style={{ width: '75%', height: 12 }} />
    <div className='fd-card__divider' />
    <div className='fd-skeleton' style={{ width: '100%', height: 4 }} />
    <div className='fd-skeleton' style={{ width: '100%', height: 4, marginTop: 8 }} />
    <div className='fd-card__divider' />
    <div className='fd-skeleton-row'>
      <div className='fd-skeleton' style={{ width: 100, height: 12 }} />
      <div className='fd-skeleton' style={{ width: 80, height: 12 }} />
    </div>
    <div className='fd-card__divider' />
    <div className='fd-skeleton' style={{ width: 80, height: 28 }} />
  </div>
)

/* ── Main screen ─────────────────────────────────────────────── */

const FeatureDashboardScreen = ({ history }) => {
  const dispatch = useDispatch()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [pendingTraffic, setPendingTraffic] = useState({})
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [updatingTraffic, setUpdatingTraffic] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const { userInfo } = useSelector((state) => state.userLogin)
  const { loading, error, features = [] } = useSelector((state) => state.featureFlagList)
  const { error: statusError } = useSelector((state) => state.featureFlagUpdateStatus)
  const { error: trafficError } = useSelector((state) => state.featureFlagUpdateTraffic)

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listFeatureFlags())
    } else {
      history.push('/login')
    }
  }, [dispatch, history, userInfo])

  // Auto-dismiss success toast after 3s
  useEffect(() => {
    if (!successMessage) return
    const t = setTimeout(() => setSuccessMessage(null), 3000)
    return () => clearTimeout(t)
  }, [successMessage])

  const getTrafficValue = (feature) =>
    pendingTraffic[feature.feature_id] !== undefined
      ? pendingTraffic[feature.feature_id]
      : feature.traffic_percentage

  const filteredFeatures = features.filter((f) => {
    const matchesFilter = filter === 'All' || f.status === filter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.feature_id.toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const statusCounts = features.reduce(
    (acc, f) => ({ ...acc, [f.status]: (acc[f.status] || 0) + 1 }),
    {}
  )

  const FILTERS = [
    { label: 'All', count: features.length },
    { label: 'Enabled', count: statusCounts.Enabled || 0 },
    { label: 'Testing', count: statusCounts.Testing || 0 },
    { label: 'Disabled', count: statusCounts.Disabled || 0 },
  ]

  const handleToggle = async (feature) => {
    if (updatingStatus) return
    const newStatus = feature.status === 'Enabled' ? 'Disabled' : 'Enabled'
    setUpdatingStatus(feature.feature_id)
    dispatch({ type: FEATURE_FLAG_UPDATE_STATUS_RESET })
    await dispatch(updateFeatureFlagStatus(feature.feature_id, newStatus))
    setUpdatingStatus(null)
    setSuccessMessage(`${feature.name} set to ${newStatus}`)
  }

  const handleTrafficChange = (featureId, value) => {
    setPendingTraffic((prev) => ({ ...prev, [featureId]: Number(value) }))
  }

  const handleTrafficCommit = async (feature) => {
    const value = pendingTraffic[feature.feature_id]
    if (value === undefined || value === feature.traffic_percentage) return
    setUpdatingTraffic(feature.feature_id)
    dispatch({ type: FEATURE_FLAG_UPDATE_TRAFFIC_RESET })
    await dispatch(updateFeatureFlagTraffic(feature.feature_id, value))
    setUpdatingTraffic(null)
    setPendingTraffic((prev) => {
      const next = { ...prev }
      delete next[feature.feature_id]
      return next
    })
    setSuccessMessage(`${feature.name} traffic set to ${value}%`)
  }

  return (
    <div className='fd-root'>
      {/* Page header */}
      <header className='fd-header'>
        <h1 className='fd-header__title'>Feature Flags</h1>
        <p className='fd-header__subtitle'>
          Manage feature rollouts, traffic allocation, and status across the platform.
        </p>
        {!loading && !error && (
          <p className='fd-header__count'>
            {filteredFeatures.length} of {features.length} features
            {filter !== 'All' ? ` · ${filter}` : ''}
            {search ? ` · "${search}"` : ''}
          </p>
        )}
      </header>

      {/* Error/success alerts */}
      {(statusError || trafficError) && (
        <div className='fd-alert fd-alert--error' role='alert'>
          <span className='fd-alert__icon'>
            <IconAlert />
          </span>
          {statusError || trafficError}
        </div>
      )}
      {successMessage && (
        <div className='fd-alert fd-alert--success' role='status' aria-live='polite'>
          <span className='fd-alert__icon'>
            <IconCheckCircle />
          </span>
          {successMessage}
        </div>
      )}

      {/* Toolbar: search + filter */}
      {!loading && !error && (
        <div className='fd-toolbar'>
          <div className='fd-search' role='search'>
            <span className='fd-search__icon' aria-hidden='true'>
              <IconSearch />
            </span>
            <input
              type='text'
              className='fd-search__input'
              placeholder='Search features…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label='Search features'
            />
          </div>
          <div className='fd-filter' role='group' aria-label='Filter by status'>
            {FILTERS.map(({ label, count }) => (
              <button
                key={label}
                className='fd-filter__btn'
                aria-pressed={filter === label ? 'true' : 'false'}
                onClick={() => setFilter(label)}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature grid */}
      <div
        className='fd-grid'
        role='list'
        aria-busy={loading ? 'true' : 'false'}
        aria-label='Feature flags'
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div role='listitem' key={i}>
              <SkeletonCard />
            </div>
          ))
        ) : error ? (
          <div
            className='fd-alert fd-alert--error'
            role='alert'
            style={{ gridColumn: '1 / -1' }}
          >
            <span className='fd-alert__icon'>
              <IconAlert />
            </span>
            {error}
          </div>
        ) : filteredFeatures.length === 0 ? (
          <div className='fd-empty' role='listitem'>
            <span className='fd-empty__icon'>
              <IconEmpty />
            </span>
            <h2 className='fd-empty__title'>No features found.</h2>
            <p className='fd-empty__text'>
              {search
                ? 'Try adjusting your search or filter.'
                : 'No features are configured.'}
            </p>
            {(search || filter !== 'All') && (
              <div className='fd-empty__actions'>
                {search && (
                  <button
                    className='fd-btn fd-btn--secondary'
                    onClick={() => setSearch('')}
                  >
                    Clear search
                  </button>
                )}
                {filter !== 'All' && (
                  <button
                    className='fd-btn fd-btn--ghost'
                    onClick={() => setFilter('All')}
                  >
                    Show all
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          filteredFeatures.map((feature) => {
            const trafficVal = getTrafficValue(feature)
            const isStatusUpdating = updatingStatus === feature.feature_id
            const isTrafficUpdating = updatingTraffic === feature.feature_id
            const isEnabled = feature.status === 'Enabled'
            const sliderCls = feature.status === 'Testing' ? 'fd-slider--testing' : ''

            return (
              <article
                className='fd-card'
                key={feature.feature_id}
                role='listitem'
                aria-label={feature.name}
              >
                {/* Header: id + name + badge */}
                <div className='fd-card__header'>
                  <div className='fd-card__title-group'>
                    <span className='fd-card__eyebrow'>{feature.feature_id}</span>
                    <h3 className='fd-card__name' title={feature.name}>
                      {feature.name}
                    </h3>
                  </div>
                  <StatusBadge status={feature.status} />
                </div>

                <div className='fd-card__divider' />

                {/* Description */}
                {feature.description && (
                  <p className='fd-card__description'>{feature.description}</p>
                )}

                {/* Traffic */}
                <div className='fd-traffic'>
                  <div className='fd-traffic__label-row'>
                    <span className='fd-traffic__label'>Traffic</span>
                    <span className='fd-traffic__value'>
                      {isTrafficUpdating ? (
                        <span className='fd-spinner' aria-label='Updating traffic…' />
                      ) : (
                        `${trafficVal}%`
                      )}
                    </span>
                  </div>
                  <div
                    className='fd-progress'
                    role='progressbar'
                    aria-valuenow={trafficVal}
                    aria-valuemin='0'
                    aria-valuemax='100'
                    aria-label={`${feature.name} traffic: ${trafficVal}%`}
                  >
                    <div
                      className={`fd-progress__bar${feature.status === 'Testing' ? ' fd-progress__bar--testing' : ''}`}
                      style={{ width: `${trafficVal}%` }}
                    />
                  </div>
                  {feature.status !== 'Disabled' && (
                    <input
                      type='range'
                      className={`fd-slider ${sliderCls}`}
                      min='0'
                      max='100'
                      value={trafficVal}
                      style={{ '--slider-percent': `${trafficVal}%` }}
                      onChange={(e) =>
                        handleTrafficChange(feature.feature_id, e.target.value)
                      }
                      onMouseUp={() => handleTrafficCommit(feature)}
                      onTouchEnd={() => handleTrafficCommit(feature)}
                      onKeyUp={() => handleTrafficCommit(feature)}
                      aria-label={`Traffic percentage for ${feature.name}`}
                      disabled={isTrafficUpdating}
                    />
                  )}
                </div>

                {/* Metadata */}
                <div className='fd-card__meta'>
                  <span className='fd-meta-item'>
                    <span className='fd-meta-item__icon' aria-hidden='true'>
                      <IconClock />
                    </span>
                    {feature.last_modified}
                  </span>
                  {feature.rollout_strategy && (
                    <span className='fd-meta-item'>
                      {feature.rollout_strategy.replace(/_/g, '\u00a0')}
                    </span>
                  )}
                  {feature.dependencies && feature.dependencies.length > 0 && (
                    <span className='fd-meta-item'>
                      {feature.dependencies.map((dep) => (
                        <span key={dep} className='fd-dep-tag'>
                          <span aria-hidden='true'>
                            <IconDep />
                          </span>
                          {dep}
                        </span>
                      ))}
                    </span>
                  )}
                </div>

                <div className='fd-card__divider' />

                {/* Actions: toggle */}
                <div className='fd-card__actions'>
                  <label className='fd-toggle-wrap'>
                    <span className='fd-toggle'>
                      <input
                        type='checkbox'
                        className='fd-toggle__input'
                        role='switch'
                        aria-checked={isEnabled}
                        checked={isEnabled}
                        onChange={() => handleToggle(feature)}
                        disabled={isStatusUpdating}
                        aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${feature.name}`}
                      />
                      <span className='fd-toggle__track' />
                      <span className='fd-toggle__thumb' />
                    </span>
                    {isStatusUpdating ? (
                      <span className='fd-spinner' aria-label='Updating…' />
                    ) : (
                      <span className='fd-toggle__label'>{feature.status}</span>
                    )}
                  </label>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}

export default FeatureDashboardScreen
