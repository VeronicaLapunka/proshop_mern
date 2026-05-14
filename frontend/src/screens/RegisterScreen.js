import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../actions/userActions'
import './screens.css'

/*
  ASCII wireframe (ANTI_SLOP):
  ┌──────────── max-width 480px, centered ─────────────┐
  │  h1: Create Account                                 │
  │  [error/mismatch alert]                             │
  │  fieldset                                           │
  │    [label: Full Name]          [input text]         │
  │    [label: Email]              [input email]        │
  │    [label: Password]           [input password]     │
  │    [label: Confirm Password]   [input password]     │
  │    [Register ──────────────────────────────────]    │
  │  ──────────────────────────────────────────────     │
  │  Already have an account? [Sign in]                 │
  └─────────────────────────────────────────────────────┘

  User journey: new visitor → create account → continue
  Primary CTA: Register button
*/

const Loader = () => (
  <div className='ps-loader' role='status' aria-label='Creating account…'>
    <div className='ps-loader__ring' />
  </div>
)

const RegisterScreen = ({ location, history }) => {
  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message,         setMessage]         = useState(null)

  const dispatch = useDispatch()

  const userRegister = useSelector((state) => state.userRegister)
  const { loading, error, userInfo } = userRegister

  const redirect = location.search ? location.search.split('=')[1] : '/'

  useEffect(() => {
    if (userInfo) {
      history.push(redirect)
    }
  }, [history, userInfo, redirect])

  const submitHandler = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
    } else {
      setMessage(null)
      dispatch(register(name, email, password))
    }
  }

  return (
    <div className='ps-checkout-page'>
      <h1 className='ps-form-title'>Create Account</h1>

      {message && (
        <div className='ps-alert ps-alert--error' role='alert'>{message}</div>
      )}
      {error && (
        <div className='ps-alert ps-alert--error' role='alert'>{error}</div>
      )}
      {loading && <Loader />}

      <form onSubmit={submitHandler} noValidate>
        <fieldset className='ps-fieldset'>
          <legend className='ps-sr-only'>New account details</legend>

          <div className='ps-form-group'>
            <label htmlFor='reg-name' className='ps-label'>
              Full Name <span className='ps-required' aria-label='required'>*</span>
            </label>
            <input
              id='reg-name'
              type='text'
              className='ps-input'
              placeholder='Your name'
              value={name}
              required
              aria-required='true'
              autoComplete='name'
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className='ps-form-group'>
            <label htmlFor='reg-email' className='ps-label'>
              Email Address <span className='ps-required' aria-label='required'>*</span>
            </label>
            <input
              id='reg-email'
              type='email'
              className='ps-input'
              placeholder='you@example.com'
              value={email}
              required
              aria-required='true'
              autoComplete='email'
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className='ps-form-group'>
            <label htmlFor='reg-password' className='ps-label'>
              Password <span className='ps-required' aria-label='required'>*</span>
            </label>
            <input
              id='reg-password'
              type='password'
              className='ps-input'
              placeholder='Create a password'
              value={password}
              required
              aria-required='true'
              autoComplete='new-password'
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className='ps-form-group'>
            <label htmlFor='reg-confirm-password' className='ps-label'>
              Confirm Password <span className='ps-required' aria-label='required'>*</span>
            </label>
            <input
              id='reg-confirm-password'
              type='password'
              className='ps-input'
              placeholder='Repeat your password'
              value={confirmPassword}
              required
              aria-required='true'
              aria-invalid={message ? 'true' : undefined}
              autoComplete='new-password'
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </fieldset>

        <button
          type='submit'
          className='ps-btn ps-btn--primary'
          disabled={loading}
          aria-busy={loading}
          style={{ marginTop: 'var(--ps-space-6)' }}
        >
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>

      <p className='ps-form-footer'>
        Already have an account?{' '}
        <Link to={redirect ? `/login?redirect=${redirect}` : '/login'}>
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default RegisterScreen
