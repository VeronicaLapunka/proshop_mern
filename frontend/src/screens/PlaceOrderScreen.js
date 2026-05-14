import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import CheckoutSteps from '../components/CheckoutSteps'
import { createOrder } from '../actions/orderActions'
import { ORDER_CREATE_RESET } from '../constants/orderConstants'
import { USER_DETAILS_RESET } from '../constants/userConstants'
import './screens.css'

/*
  ASCII wireframe (ANTI_SLOP):
  [Step 1 ✓] [Step 2 ✓] [Step 3 ✓] [Step 4: Place Order ●]
  ─────────────────────────────────────── 48px gap
  ┌─────────────────────────────────┬──────────────────────┐
  │  Shipping                       │  Order Summary       │
  │  123 Main St, City 12345, US    │  Items:   $xx.xx     │
  │  ─────────────────────────────  │  Shipping: $xx.xx    │
  │  Payment Method                 │  Tax:      $xx.xx    │
  │  PayPal                         │  ─────────────────   │
  │  ─────────────────────────────  │  Total:   $xx.xx     │
  │  Order Items                    │  ─────────────────   │
  │  [img] Name          N×$p=$x    │  [Place Order ─────] │
  │  [img] Name          N×$p=$x    │                      │
  └─────────────────────────────────┴──────────────────────┘

  User journey: buyer with cart + shipping + payment → review → Place Order
  Primary CTA: Place Order button
*/

const PlaceOrderScreen = ({ history }) => {
  const dispatch = useDispatch()

  const cart = useSelector((state) => state.cart)

  if (!cart.shippingAddress.address) {
    history.push('/shipping')
  } else if (!cart.paymentMethod) {
    history.push('/payment')
  }

  // Calculate prices
  const addDecimals = (num) => (Math.round(num * 100) / 100).toFixed(2)

  cart.itemsPrice    = addDecimals(cart.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0))
  cart.shippingPrice = addDecimals(cart.itemsPrice > 100 ? 0 : 100)
  cart.taxPrice      = addDecimals(Number((0.15 * cart.itemsPrice).toFixed(2)))
  cart.totalPrice    = (
    Number(cart.itemsPrice) +
    Number(cart.shippingPrice) +
    Number(cart.taxPrice)
  ).toFixed(2)

  const orderCreate = useSelector((state) => state.orderCreate)
  const { order, success, error } = orderCreate

  useEffect(() => {
    if (success) {
      history.push(`/order/${order._id}`)
      dispatch({ type: USER_DETAILS_RESET })
      dispatch({ type: ORDER_CREATE_RESET })
    }
    // eslint-disable-next-line
  }, [history, success])

  const placeOrderHandler = () => {
    dispatch(
      createOrder({
        orderItems:      cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod:   cart.paymentMethod,
        itemsPrice:      cart.itemsPrice,
        shippingPrice:   cart.shippingPrice,
        taxPrice:        cart.taxPrice,
        totalPrice:      cart.totalPrice,
      })
    )
  }

  return (
    <>
      <CheckoutSteps step1 step2 step3 step4 />

      <div className='ps-placeorder-layout'>
        {/* ── Left: order details ── */}
        <div className='ps-order-sections'>

          {/* Shipping */}
          <section aria-labelledby='po-shipping-heading' className='ps-order-section'>
            <h2 id='po-shipping-heading' className='ps-order-section__title'>Shipping</h2>
            <p className='ps-order-section__text'>
              {cart.shippingAddress.address}, {cart.shippingAddress.city}{' '}
              {cart.shippingAddress.postalCode}, {cart.shippingAddress.country}
            </p>
          </section>

          <hr className='ps-divider' />

          {/* Payment */}
          <section aria-labelledby='po-payment-heading' className='ps-order-section'>
            <h2 id='po-payment-heading' className='ps-order-section__title'>Payment Method</h2>
            <p className='ps-order-section__text'>{cart.paymentMethod}</p>
          </section>

          <hr className='ps-divider' />

          {/* Order items */}
          <section aria-labelledby='po-items-heading' className='ps-order-section'>
            <h2 id='po-items-heading' className='ps-order-section__title'>Order Items</h2>

            {cart.cartItems.length === 0 ? (
              <div className='ps-alert ps-alert--info' role='status'>
                Your cart is empty.
              </div>
            ) : (
              <ul className='ps-order-items-list' aria-label='Items in your order'>
                {cart.cartItems.map((item, index) => (
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
                      {item.qty} × ${item.price} = ${addDecimals(item.qty * item.price)}
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
              <span className='ps-summary-row__value'>${cart.itemsPrice}</span>
            </div>

            <div className='ps-summary-row'>
              <span className='ps-summary-row__label'>Shipping</span>
              <span className='ps-summary-row__value'>${cart.shippingPrice}</span>
            </div>

            <div className='ps-summary-row'>
              <span className='ps-summary-row__label'>Tax</span>
              <span className='ps-summary-row__value'>${cart.taxPrice}</span>
            </div>

            <hr className='ps-divider' />

            <div
              className='ps-summary-row ps-summary-row--total'
              aria-label={`Order total: $${cart.totalPrice}`}
            >
              <span className='ps-summary-row__label'>Total</span>
              <span className='ps-summary-row__value'>${cart.totalPrice}</span>
            </div>

            <hr className='ps-divider' />

            {error && (
              <div className='ps-alert ps-alert--error' role='alert'>
                {error}
              </div>
            )}

            <button
              type='button'
              className='ps-btn ps-btn--primary'
              disabled={cart.cartItems.length === 0}
              aria-disabled={cart.cartItems.length === 0}
              onClick={placeOrderHandler}
            >
              Place Order
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

export default PlaceOrderScreen
