import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { listOrders } from '../actions/orderActions'
import './screens.css'

const OrderListScreen = ({ history }) => {
  const dispatch = useDispatch()

  const orderList = useSelector((state) => state.orderList)
  const { loading, error, orders } = orderList

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listOrders())
    } else {
      history.push('/login')
    }
  }, [dispatch, history, userInfo])

  return (
    <>
      <h1 className='ps-admin-title'>Orders</h1>

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
                <th scope='col'>USER</th>
                <th scope='col'>DATE</th>
                <th scope='col'>TOTAL</th>
                <th scope='col'>PAID</th>
                <th scope='col'>DELIVERED</th>
                <th scope='col'><span className='ps-sr-only'>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id}</td>
                  <td>{order.user && order.user.name}</td>
                  <td>{order.createdAt.substring(0, 10)}</td>
                  <td>${order.totalPrice}</td>
                  <td>
                    {order.isPaid ? (
                      <span className='ps-badge ps-badge--success'>
                        {order.paidAt.substring(0, 10)}
                      </span>
                    ) : (
                      <span className='ps-badge ps-badge--danger'>Not paid</span>
                    )}
                  </td>
                  <td>
                    {order.isDelivered ? (
                      <span className='ps-badge ps-badge--success'>
                        {order.deliveredAt.substring(0, 10)}
                      </span>
                    ) : (
                      <span className='ps-badge ps-badge--danger'>Pending</span>
                    )}
                  </td>
                  <td>
                    <Link
                      to={`/order/${order._id}`}
                      className='ps-btn ps-btn--ghost'
                      style={{ display: 'inline-flex' }}
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
    </>
  )
}

export default OrderListScreen
