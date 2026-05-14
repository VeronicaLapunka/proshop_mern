import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { listUsers, deleteUser } from '../actions/userActions'
import './screens.css'

const IconCheck = () => (
  <svg width='14' height='14' viewBox='0 0 14 14' fill='none'
    stroke='currentColor' strokeWidth='2' strokeLinecap='round'
    strokeLinejoin='round' aria-hidden='true'>
    <path d='M2 7l4 4 6-6' />
  </svg>
)

const IconX = () => (
  <svg width='12' height='12' viewBox='0 0 12 12' fill='none'
    stroke='currentColor' strokeWidth='2' strokeLinecap='round' aria-hidden='true'>
    <path d='M1 1l10 10M11 1L1 11' />
  </svg>
)

const IconEdit = () => (
  <svg width='14' height='14' viewBox='0 0 14 14' fill='none'
    stroke='currentColor' strokeWidth='2' strokeLinecap='round'
    strokeLinejoin='round' aria-hidden='true'>
    <path d='M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z' />
  </svg>
)

const IconTrash = () => (
  <svg width='14' height='14' viewBox='0 0 14 14' fill='none'
    stroke='currentColor' strokeWidth='2' strokeLinecap='round'
    strokeLinejoin='round' aria-hidden='true'>
    <path d='M2 4h10M5 4V2h4v2M5.5 4v7M8.5 4v7M3 4l1 8h6l1-8' />
  </svg>
)

const UserListScreen = ({ history }) => {
  const dispatch = useDispatch()

  const userList = useSelector((state) => state.userList)
  const { loading, error, users } = userList

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const userDelete = useSelector((state) => state.userDelete)
  const { success: successDelete } = userDelete

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listUsers())
    } else {
      history.push('/login')
    }
  }, [dispatch, history, successDelete, userInfo])

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure')) {
      dispatch(deleteUser(id))
    }
  }

  return (
    <>
      <h1 className='ps-admin-title'>Users</h1>

      {loading ? (
        <div className='ps-loader' role='status' aria-label='Loading'>
          <div className='ps-loader__ring' />
        </div>
      ) : error ? (
        <div className='ps-alert ps-alert--error' role='alert'>{error}</div>
      ) : (
        <div className='ps-table-wrap'>
          <table className='ps-table'>
            <thead>
              <tr>
                <th scope='col'>ID</th>
                <th scope='col'>NAME</th>
                <th scope='col'>EMAIL</th>
                <th scope='col'>ADMIN</th>
                <th scope='col'><span className='ps-sr-only'>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user._id}</td>
                  <td>{user.name}</td>
                  <td>
                    <a href={`mailto:${user.email}`}>{user.email}</a>
                  </td>
                  <td>
                    {user.isAdmin ? (
                      <span className='ps-badge ps-badge--success'>
                        <IconCheck /> Yes
                      </span>
                    ) : (
                      <span className='ps-badge ps-badge--danger'>
                        <IconX /> No
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <Link
                      to={`/admin/user/${user._id}/edit`}
                      className='ps-btn ps-btn--ghost'
                      style={{ display: 'inline-flex', marginRight: 8 }}
                      aria-label={`Edit ${user.name}`}
                    >
                      <IconEdit />
                    </Link>
                    <button
                      className='ps-btn ps-btn--icon'
                      onClick={() => deleteHandler(user._id)}
                      aria-label={`Delete ${user.name}`}
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default UserListScreen
