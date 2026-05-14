import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getUserDetails, updateUser } from '../actions/userActions'
import { USER_UPDATE_RESET } from '../constants/userConstants'
import './screens.css'

const UserEditScreen = ({ match, history }) => {
  const userId = match.params.id

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const dispatch = useDispatch()

  const userDetails = useSelector((state) => state.userDetails)
  const { loading, error, user } = userDetails

  const userUpdate = useSelector((state) => state.userUpdate)
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = userUpdate

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: USER_UPDATE_RESET })
      history.push('/admin/userlist')
    } else {
      if (!user.name || user._id !== userId) {
        dispatch(getUserDetails(userId))
      } else {
        setName(user.name)
        setEmail(user.email)
        setIsAdmin(user.isAdmin)
      }
    }
  }, [dispatch, history, userId, user, successUpdate])

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(updateUser({ _id: userId, name, email, isAdmin }))
  }

  return (
    <>
      <Link to='/admin/userlist' className='ps-back'>
        &#8592; Back to Users
      </Link>

      <div className='ps-checkout-page'>
        <h1 className='ps-form-title'>Edit User</h1>

        {loadingUpdate && (
          <div className='ps-loader' role='status' aria-label='Saving'>
            <div className='ps-loader__ring' />
          </div>
        )}
        {errorUpdate && (
          <div className='ps-alert ps-alert--error' role='alert'>{errorUpdate}</div>
        )}

        {loading ? (
          <div className='ps-loader' role='status' aria-label='Loading'>
            <div className='ps-loader__ring' />
          </div>
        ) : error ? (
          <div className='ps-alert ps-alert--error' role='alert'>{error}</div>
        ) : (
          <form onSubmit={submitHandler}>
            <fieldset className='ps-fieldset'>
              <legend>User Details</legend>

              <div className='ps-form-group'>
                <label className='ps-label' htmlFor='name'>
                  Name <span className='ps-required' aria-hidden='true'>*</span>
                </label>
                <input
                  id='name'
                  type='text'
                  className='ps-input'
                  placeholder='Enter name'
                  value={name}
                  required
                  aria-required='true'
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className='ps-form-group'>
                <label className='ps-label' htmlFor='email'>
                  Email Address <span className='ps-required' aria-hidden='true'>*</span>
                </label>
                <input
                  id='email'
                  type='email'
                  className='ps-input'
                  placeholder='Enter email'
                  value={email}
                  required
                  aria-required='true'
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className='ps-checkbox-group'>
                <input
                  id='isadmin'
                  type='checkbox'
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
                <label htmlFor='isadmin'>Is Admin</label>
              </div>
            </fieldset>

            <div className='ps-form-submit'>
              <button type='submit' className='ps-btn ps-btn--primary'>
                Update
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}

export default UserEditScreen
