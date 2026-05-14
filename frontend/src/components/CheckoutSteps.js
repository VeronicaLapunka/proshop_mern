import React from 'react'
import { Link } from 'react-router-dom'
import '../screens/screens.css'

const STEPS = [
  { label: 'Sign In',     path: '/login',      flag: 'step1' },
  { label: 'Shipping',    path: '/shipping',   flag: 'step2' },
  { label: 'Payment',     path: '/payment',    flag: 'step3' },
  { label: 'Place Order', path: '/placeorder', flag: 'step4' },
]

// Check SVG for completed steps
const IconCheck = () => (
  <svg width='14' height='14' viewBox='0 0 14 14' fill='none' aria-hidden='true'>
    <path
      d='M2.5 7L5.5 10L11.5 4'
      stroke='white'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
  const flags = { step1, step2, step3, step4 }
  // Active = last enabled step; done = all enabled steps before active
  const stepValues = [step1, step2, step3, step4].map(Boolean)
  const activeIndex = stepValues.lastIndexOf(true)

  return (
    <nav aria-label='Checkout progress' className='ps-steps-nav'>
      <ol className='ps-steps'>
        {STEPS.map((step, i) => {
          const isActive = i === activeIndex
          const isDone   = i < activeIndex && stepValues[i]
          const dotCls   = isActive ? 'ps-step__dot--active'
                         : isDone   ? 'ps-step__dot--done'
                         : ''
          const lblCls   = isActive ? 'ps-step__label--active'
                         : isDone   ? 'ps-step__label--done'
                         : ''
          // Connector between step[i-1] and step[i] is green when step[i] is reached
          const connectorDone = i > 0 && i <= activeIndex

          return (
            <li
              key={step.label}
              className='ps-step'
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Connector line before this step (except first) */}
              {i > 0 && (
                <div
                  className={`ps-step__connector${connectorDone ? ' ps-step__connector--done' : ''}`}
                  aria-hidden='true'
                />
              )}

              <div className='ps-step__body'>
                <span className={`ps-step__dot ${dotCls}`} aria-hidden='true'>
                  {isDone ? <IconCheck /> : i + 1}
                </span>

                {isActive ? (
                  <span className={`ps-step__label ${lblCls}`}>{step.label}</span>
                ) : isDone ? (
                  <Link to={step.path} className={`ps-step__label ${lblCls}`}>
                    {step.label}
                  </Link>
                ) : (
                  <span
                    className='ps-step__label'
                    aria-disabled='true'
                  >
                    {step.label}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default CheckoutSteps
