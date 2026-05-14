import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getUserDetails, updateUserProfile } from '../actions/userActions'
import { listMyOrders } from '../actions/orderActions'
import { USER_UPDATE_PROFILE_RESET } from '../constants/userConstants'
import './screens.css'

/*
  ASCII wireframe (ANTI_SLOP):
  ┌──────────────────────┬────────────────────────────────────────────────┐
  │  h2: User Profile    │  h2: My Orders                                 │
  │  [success alert]     │  ┌──────────────────────────────────────────┐  │
  │  [error alert]       │  │  ID │ DATE │ TOTAL │ PAID │ DELIVERED    │  │
  │  fieldset            │  ├──────────────────────────────────────────┤  │
  │    [Name]            │  │  ..   ....   .....   ●       ●           │  │
  │    [Email]           │  │  ..   ....   .....   ✗       ✗  [Detail] │  │
  │    [Password]        │  └──────────────────────────────────────────┘  │
  │    [Confirm Pwd]     │                                                 │
  │    [Update Profile]  │                                                 │
  └──────────────────────┴─────────────────────────────────────────────────┘

  User journey: logged-in buyer → update profile / review order history
  Primary CTA: Update Profile button
*/

// No FA icon dependency — inline SVG X mark
const IconX = () => (
  <svg
    width='12' height='12' viewBox='0 0 12 12'
    fill='none' stroke='currentColor' strokeWidth='2'
    strokeLinecap='round' aria-hidden='true'
  >
    <path d='M1 1l10 10M11 1L1 11' />
  </svg>
)

const Loader = () => (
  <div className='ps-loader' role='status' aria-label='Loading…'>
    <div className='ps-loader__ring' />
  </div>
)

const ProfileScreen = ({ history }) => {
  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message,         setMessage]         = useState(null)

  const dispatch = useDispatch()

  const userDetails = useSelector((state) => state.userDetails)
  const { loading, error, user } = userDetails

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile)
  const { success } = userUpdateProfile

  const orderListMy = useSelector((state) => state.orderListMy)
  const { loading: loadingOrders, error: errorOrders, orders } = orderListMy

  useEffect(() => {
    if (!userInfo) {
      history.push('/login')
    } else {
      if (!user || !user.name || success) {
        dispatch({ type: USER_UPDATE_PROFILE_RESET })
        dispatch(getUserDetails('profile'))
        dispatch(listMyOrders())
      } else {
        setName(user.name)
        setEmail(user.email)
      }
    }
  }, [dispatch, history, userInfo, user, success])

  const submitHandler = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
    } else {
      setMessage(null)
      dispatch(updateUserProfile({ id: user._id, name, email, password }))
    }
  }

  return (
    <div className='ps-profile-layout'>
      {/* ── Left: edit profile ── */}
      <div>
        <h2 className='ps-profile-title'>User Profile</h2>

        {message && (
          <div className='ps-alert ps-alert--error' role='alert'>{message}</div>
        )}
        {success && (
          <div className='ps-alert ps-alert--success' role='status' aria-live='polite'>
            Profile updated successfully.
          </div>
        )}
        {error && (
          <div className='ps-alert ps-alert--error' role='alert'>{error}</div>
        )}

        {loading ? (
          <Loader />
        ) : (
          <form onSubmit={submitHandler} noValidate>
            <fieldset className='ps-fieldset'>
              <legend className='ps-sr-only'>Profile details</legend>

              <div className='ps-form-group'>
                <label htmlFor='profile-name' className='ps-label'>Name</label>
                <input
                  id='profile-name'
                  type='text'
                  className='ps-input'
                  placeholder='Your name'
                  value={name}
                  autoComplete='name'
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className='ps-form-group'>
                <label htmlFor='profile-email' className='ps-label'>Email Address</label>
                <input
                  id='profile-email'
                  type='email'
                  className='ps-input'
                  placeholder='you@example.com'
                  value={email}
                  autoComplete='email'
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className='ps-form-group'>
                <label htmlFor='profile-password' className='ps-label'>New Password</label>
                <input
                  id='profile-password'
                  type='password'
                  className='ps-input'
                  placeholder='Leave blank to keep current'
                  value={password}
                  autoComplete='new-password'
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className='ps-form-group'>
                <label htmlFor='profile-confirm-password' className='ps-label'>
                  Confirm Password
                </label>
                <input
                  id='profile-confirm-password'
                  type='password'
                  className='ps-input'
                  placeholder='Repeat new password'
                  value={confirmPassword}
                  aria-invalid={message ? 'true' : undefined}
                  autoComplete='new-password'
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </fieldset>

            <button
              type='submit'
              className='ps-btn ps-btn--primary'
              style={{ marginTop: 'var(--ps-space-6)' }}
            >
              Update Profile
            </button>
          </form>
        )}
      </div>

      {/* ── Right: order history ── */}
      <div>
        <h2 className='ps-profile-title'>My Orders</h2>

        {loadingOrders ? (
          <Loader />
        ) : errorOrders ? (
          <div className='ps-alert ps-alert--error' role='alert'>{errorOrders}</div>
        ) : orders.length === 0 ? (
          <div className='ps-alert ps-alert--info' role='status'>
            No orders yet. <Link to='/'>Start shopping</Link>
          </div>
        ) : (
          <div className='ps-table-wrap'>
            <table className='ps-table'>
              <thead>
                <tr>
                  <th scope='col'>Order ID</th>
                  <th scope='col'>Date</th>
                  <th scope='col'>Total</th>
                  <th scope='col'>Paid</th>
                  <th scope='col'>Delivered</th>
                  <th scope='col'><span className='ps-sr-only'>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {order._id}
                    </td>
                    <td>{order.createdAt.substring(0, 10)}</td>
                    <td>${order.totalPrice}</td>
                    <td>
                      {order.isPaid ? (
                        <span className='ps-badge ps-badge--success'>
                          {order.paidAt.substring(0, 10)}
                        </span>
                      ) : (
                        <span className='ps-badge ps-badge--danger' aria-label='Not paid'>
                          <IconX /> No
                        </span>
                      )}
                    </td>
                    <td>
                      {order.isDelivered ? (
                        <span className='ps-badge ps-badge--success'>
                          {order.deliveredAt.substring(0, 10)}
                        </span>
                      ) : (
                        <span className='ps-badge ps-badge--danger' aria-label='Not delivered'>
                          <IconX /> No
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/order/${order._id}`}
                        className='ps-btn ps-btn--ghost'
                        style={{ height: '32px', padding: '0 12px', width: 'auto', fontSize: '13px' }}
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileScreen
