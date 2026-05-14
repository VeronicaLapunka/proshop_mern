import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../actions/userActions'
import './screens.css'

/*
  ASCII wireframe (ANTI_SLOP):
  ┌──────────── max-width 480px, centered ─────────────┐
  │  h1: Sign In                                        │
  │  [error alert]                                      │
  │  fieldset                                           │
  │    [label: Email]    [input email]                  │
  │    [label: Password] [input password]               │
  │    [Sign In ───────────────────────────────────]    │
  │  ──────────────────────────────────────────────     │
  │  New Customer? [Create an account]                  │
  └─────────────────────────────────────────────────────┘

  User journey: returning customer → sign in → continue
  Primary CTA: Sign In button
*/

const Loader = () => (
  <div className='ps-loader' role='status' aria-label='Signing in…'>
    <div className='ps-loader__ring' />
  </div>
)

const LoginScreen = ({ location, history }) => {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  const dispatch = useDispatch()

  const userLogin = useSelector((state) => state.userLogin)
  const { loading, error, userInfo } = userLogin

  const redirect = location.search ? location.search.split('=')[1] : '/'

  useEffect(() => {
    if (userInfo) {
      history.push(redirect)
    }
  }, [history, userInfo, redirect])

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(login(email, password))
  }

  return (
    <div className='ps-checkout-page'>
      <h1 className='ps-form-title'>Sign In</h1>

      {error && (
        <div className='ps-alert ps-alert--error' role='alert'>{error}</div>
      )}
      {loading && <Loader />}

      <form onSubmit={submitHandler} noValidate>
        <fieldset className='ps-fieldset'>
          <legend className='ps-sr-only'>Account credentials</legend>

          <div className='ps-form-group'>
            <label htmlFor='login-email' className='ps-label'>
              Email Address <span className='ps-required' aria-label='required'>*</span>
            </label>
            <input
              id='login-email'
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
            <label htmlFor='login-password' className='ps-label'>
              Password <span className='ps-required' aria-label='required'>*</span>
            </label>
            <input
              id='login-password'
              type='password'
              className='ps-input'
              placeholder='Enter password'
              value={password}
              required
              aria-required='true'
              autoComplete='current-password'
              onChange={(e) => setPassword(e.target.value)}
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
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className='ps-form-footer'>
        New Customer?{' '}
        <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
          Create an account
        </Link>
      </p>
    </div>
  )
}

export default LoginScreen
