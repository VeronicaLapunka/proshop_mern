import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { PayPalButton } from 'react-paypal-button-v2'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  getOrderDetails,
  payOrder,
  deliverOrder,
} from '../actions/orderActions'
import {
  ORDER_PAY_RESET,
  ORDER_DELIVER_RESET,
} from '../constants/orderConstants'
import './screens.css'

/*
  ASCII wireframe (ANTI_SLOP):
  h1: Order #<id>
  ┌─────────────────────────────────┬──────────────────────┐
  │  Shipping                       │  Order Summary       │
  │  Name · Email · Address         │  Items:   $xx.xx     │
  │  [Delivered ●] / [Not yet ✗]    │  Shipping: $xx.xx    │
  │  ─────────────────────────────  │  Tax:      $xx.xx    │
  │  Payment Method                 │  ──────────────────  │
  │  PayPal   [Paid ●] / [Not ✗]    │  Total:   $xx.xx     │
  │  ─────────────────────────────  │  ──────────────────  │
  │  Order Items                    │  [PayPal button]     │
  │  [img] Name       N×$p = $x     │     OR               │
  └─────────────────────────────────┴  [Mark as Delivered] ┘

  User journey: buyer → review order status → pay / track
  Primary CTA: PayPal button (unpaid) / status review (paid)
*/

const Loader = () => (
  <div className='ps-loader' role='status' aria-label='Loading…'>
    <div className='ps-loader__ring' />
  </div>
)

const OrderScreen = ({ match, history }) => {
  const orderId = match.params.id

  const [sdkReady, setSdkReady] = useState(false)

  const dispatch = useDispatch()

  const orderDetails = useSelector((state) => state.orderDetails)
  const { order, loading, error } = orderDetails

  const orderPay = useSelector((state) => state.orderPay)
  const { loading: loadingPay, success: successPay } = orderPay

  const orderDeliver = useSelector((state) => state.orderDeliver)
  const { loading: loadingDeliver, success: successDeliver } = orderDeliver

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  if (!loading) {
    //   Calculate prices
    const addDecimals = (num) => {
      return (Math.round(num * 100) / 100).toFixed(2)
    }

    order.itemsPrice = addDecimals(
      order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0)
    )
  }

  useEffect(() => {
    if (!userInfo) {
      history.push('/login')
    }

    const addPayPalScript = async () => {
      const { data: clientId } = await axios.get('/api/config/paypal')
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`
      script.async = true
      script.onload = () => {
        setSdkReady(true)
      }
      document.body.appendChild(script)
    }

    if (!order || successPay || successDeliver || order._id !== orderId) {
      dispatch({ type: ORDER_PAY_RESET })
      dispatch({ type: ORDER_DELIVER_RESET })
      dispatch(getOrderDetails(orderId))
    } else if (!order.isPaid) {
      if (!window.paypal) {
        addPayPalScript()
      } else {
        setSdkReady(true)
      }
    }
  }, [dispatch, orderId, successPay, successDeliver, order])

  const successPaymentHandler = (paymentResult) => {
    console.log(paymentResult)
    dispatch(payOrder(orderId, paymentResult))
  }

  const deliverHandler = () => {
    dispatch(deliverOrder(order))
  }

  return loading ? (
    <Loader />
  ) : error ? (
    <div className='ps-alert ps-alert--error' role='alert'>{error}</div>
  ) : (
    <>
      <h1 className='ps-order-heading'>
        Order{' '}
        <span style={{ fontWeight: 'var(--ps-fw-light)', fontSize: '0.65em', wordBreak: 'break-all' }}>
          #{order._id}
        </span>
      </h1>

      <div className='ps-placeorder-layout'>
        {/* ── Left: order details ── */}
        <div className='ps-order-sections'>

          {/* Shipping */}
          <section aria-labelledby='ord-shipping-heading' className='ps-order-section'>
            <h2 id='ord-shipping-heading' className='ps-order-section__title'>Shipping</h2>
            <div className='ps-order-meta'>
              <span><strong>Name:</strong> {order.user.name}</span>
              <span>
                <strong>Email:</strong>{' '}
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </span>
              <span>
                <strong>Address:</strong>{' '}
                {order.shippingAddress.address}, {order.shippingAddress.city}{' '}
                {order.shippingAddress.postalCode}, {order.shippingAddress.country}
              </span>
            </div>
            <div style={{ marginTop: 'var(--ps-space-4)' }}>
              {order.isDelivered ? (
                <span className='ps-badge ps-badge--success'>
                  Delivered on {order.deliveredAt.substring(0, 10)}
                </span>
              ) : (
                <span className='ps-badge ps-badge--danger'>Not delivered</span>
              )}
            </div>
          </section>

          <hr className='ps-divider' />

          {/* Payment */}
          <section aria-labelledby='ord-payment-heading' className='ps-order-section'>
            <h2 id='ord-payment-heading' className='ps-order-section__title'>Payment Method</h2>
            <p className='ps-order-section__text'>{order.paymentMethod}</p>
            <div style={{ marginTop: 'var(--ps-space-4)' }}>
              {order.isPaid ? (
                <span className='ps-badge ps-badge--success'>
                  Paid on {order.paidAt.substring(0, 10)}
                </span>
              ) : (
                <span className='ps-badge ps-badge--danger'>Not paid</span>
              )}
            </div>
          </section>

          <hr className='ps-divider' />

          {/* Order items */}
          <section aria-labelledby='ord-items-heading' className='ps-order-section'>
            <h2 id='ord-items-heading' className='ps-order-section__title'>Order Items</h2>

            {order.orderItems.length === 0 ? (
              <div className='ps-alert ps-alert--info' role='status'>Order is empty.</div>
            ) : (
              <ul className='ps-order-items-list' aria-label='Items in this order'>
                {order.orderItems.map((item, index) => (
                  <li key={index} className='ps-order-item'>
                    <img
                      src={item.image}
                      alt={item.name}
                      className='ps-order-item__img'
                      loading='lazy'
                    />
                    <Link to={`/product/${item.product}`} className='ps-order-item__name'>
                      {item.name}
                    </Link>
                    <span className='ps-order-item__calc'>
                      {item.qty} × ${item.price} = $
                      {(Math.round(item.qty * item.price * 100) / 100).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Right: summary card ── */}
        <aside aria-label='Order summary'>
          <div className='ps-summary-card'>
            <h2 className='ps-summary-title'>Order Summary</h2>

            <hr className='ps-divider' />

            <div className='ps-summary-row'>
              <span className='ps-summary-row__label'>Items</span>
              <span className='ps-summary-row__value'>${order.itemsPrice}</span>
            </div>
            <div className='ps-summary-row'>
              <span className='ps-summary-row__label'>Shipping</span>
              <span className='ps-summary-row__value'>${order.shippingPrice}</span>
            </div>
            <div className='ps-summary-row'>
              <span className='ps-summary-row__label'>Tax</span>
              <span className='ps-summary-row__value'>${order.taxPrice}</span>
            </div>

            <hr className='ps-divider' />

            <div className='ps-summary-row ps-summary-row--total'>
              <span className='ps-summary-row__label'>Total</span>
              <span className='ps-summary-row__value'>${order.totalPrice}</span>
            </div>

            {!order.isPaid && (
              <>
                <hr className='ps-divider' />
                {loadingPay && <Loader />}
                {!sdkReady ? (
                  <Loader />
                ) : (
                  <PayPalButton
                    amount={order.totalPrice}
                    onSuccess={successPaymentHandler}
                  />
                )}
              </>
            )}

            {loadingDeliver && <Loader />}

            {userInfo &&
              userInfo.isAdmin &&
              order.isPaid &&
              !order.isDelivered && (
                <>
                  <hr className='ps-divider' />
                  <button
                    type='button'
                    className='ps-btn ps-btn--primary'
                    onClick={deliverHandler}
                  >
                    Mark as Delivered
                  </button>
                </>
              )}
          </div>
        </aside>
      </div>
    </>
  )
}

export default OrderScreen
