import React, { useState } from 'react'

const N8N_URL = process.env.REACT_APP_N8N_WEBHOOK_URL
const N8N_API_KEY = process.env.REACT_APP_N8N_API_KEY

const IconPlay = () => (
  <svg viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
    <circle cx='8' cy='8' r='6.5' />
    <path d='M6.5 5.5l4 2.5-4 2.5V5.5z' fill='currentColor' stroke='none' />
  </svg>
)

const IconTest = () => (
  <svg viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M5 2h6M6 2v5l-3 7h10L10 7V2' />
  </svg>
)

const IconRollback = () => (
  <svg viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M3 8a5 5 0 1 0 1.5-3.5' />
    <path d='M3 4v4h4' />
  </svg>
)

export default function AutoPilotControls({ feature, onUpdate }) {
  const [loading, setLoading] = useState(null)
  const [feedback, setFeedback] = useState(null)

  async function callAutoPilot(action, extras = {}) {
    setLoading(action)
    setFeedback(null)

    try {
      const response = await fetch(`${N8N_URL}/feature-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': N8N_API_KEY,
        },
        body: JSON.stringify({
          feature_id: feature.feature_id,
          action,
          ...extras,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.success === false) {
        setFeedback({ type: 'error', message: result.message || `HTTP ${response.status}` })
        return
      }

      setFeedback({ type: 'success', message: result.message })
      if (onUpdate && result.current_state) {
        onUpdate(result.current_state)
      }
    } catch (e) {
      setFeedback({ type: 'error', message: `Network error: ${e.message}` })
    } finally {
      setLoading(null)
    }
  }

  const busy = loading !== null

  return (
    <div className='fd-autopilot' aria-label='Auto-Pilot Controls'>
      <div className='fd-autopilot__header'>
        <span className='fd-card__eyebrow'>Auto-Pilot</span>
        <h3 className='fd-autopilot__title'>{feature.name}</h3>
      </div>

      <div className='fd-autopilot__buttons'>
        <button
          className='fd-btn fd-btn--secondary fd-autopilot__btn'
          onClick={() => callAutoPilot('check')}
          disabled={busy}
          aria-label={`Run health check for ${feature.name}`}
        >
          <span className='fd-autopilot__btn-icon' aria-hidden='true'><IconPlay /></span>
          {loading === 'check' ? 'Checking…' : 'Run Check'}
        </button>

        <button
          className='fd-btn fd-btn--secondary fd-autopilot__btn'
          onClick={() => callAutoPilot('test', { target_state: 'Testing' })}
          disabled={busy}
          aria-label={`Switch ${feature.name} to Testing`}
        >
          <span className='fd-autopilot__btn-icon' aria-hidden='true'><IconTest /></span>
          {loading === 'test' ? 'Switching…' : 'Testing Mode'}
        </button>

        <button
          className='fd-btn fd-autopilot__btn fd-autopilot__btn--danger'
          onClick={() => callAutoPilot('rollback', { target_state: 'Disabled' })}
          disabled={busy}
          aria-label={`Rollback ${feature.name} to Disabled`}
        >
          <span className='fd-autopilot__btn-icon' aria-hidden='true'><IconRollback /></span>
          {loading === 'rollback' ? 'Rolling back…' : 'Rollback'}
        </button>
      </div>

      {feedback && (
        <div
          className={`fd-alert fd-alert--${feedback.type === 'success' ? 'success' : 'error'} fd-autopilot__feedback`}
          role='alert'
          aria-live='polite'
        >
          {feedback.message}
        </div>
      )}
    </div>
  )
}
