import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, removeFromCart } from '../actions/cartActions'
import './screens.css'

/*
  ASCII wireframe (ANTI_SLOP):
  h1: Shopping Cart
  ┌────────────────────────────────────┬─────────────────────┐
  │  [img] Name              $price    │  Order Summary      │
  │        [select qty]   [× remove]  │  Items (N): $xxx    │
  │  ────────────────────────────────  │  ─────────────────  │
  │  [img] Name              $price    │  [Proceed to        │
  │        [select qty]   [× remove]  │   Checkout ───────] │
  └────────────────────────────────────┴─────────────────────┘

  User journey: buyer with items → review cart → Proceed to Checkout
  Primary CTA: Proceed to Checkout button
*/

// Trash / remove icon — no emoji per ANTI_SLOP
const IconTrash = () => (
  <svg
    width='18' height='18' viewBox='0 0 18 18'
    fill='none' stroke='currentColor' strokeWidth='1.5'
    strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'
  >
    <path d='M3 5h12M8 5V3h2v2M7 5l.5 10M11 5l-.5 10' />
  </svg>
)

const IconCart = () => (
  <svg
    width='64' height='64' viewBox='0 0 64 64'
    fill='none' stroke='currentColor' strokeWidth='1.5'
    strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'
  >
    <path d='M4 4h8l5 28h26l5-20H16' />
    <circle cx='24' cy='52' r='3' />
    <circle cx='44' cy='52' r='3' />
  </svg>
)

const CartScreen = ({ match, location, history }) => {
  const productId = match.params.id
  const qty       = location.search ? Number(location.search.split('=')[1]) : 1

  const dispatch = useDispatch()
  const cart = useSelector((state) => state.cart)
  const { cartItems } = cart

  // Live region for cart count announcements (WCAG 4.1.3)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (productId) {
      dispatch(addToCart(productId, qty))
    }
  }, [dispatch, productId, qty])

  const removeFromCartHandler = (id, name) => {
    dispatch(removeFromCart(id))
    setAnnouncement(`${name} removed from cart.`)
  }

  const qtyChangeHandler = (item, newQty) => {
    dispatch(addToCart(item.product, Number(newQty)))
    setAnnouncement(`${item.name} quantity updated to ${newQty}.`)
  }

  const checkoutHandler = () => {
    history.push('/login?redirect=shipping')
  }

  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0)
  const totalPrice = cartItems
    .reduce((acc, item) => acc + item.qty * item.price, 0)
    .toFixed(2)

  return (
    <>
      {/* WCAG 4.1.3 — announce cart changes to screen readers */}
      <div
        role='status'
        aria-live='polite'
        aria-atomic='true'
        className='ps-live-region'
      >
        {announcement}
      </div>

      <h1 className='ps-cart-title'>Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className='ps-empty'>
          <span className='ps-empty__icon'>
            <IconCart />
          </span>
          <h2 className='ps-empty__title'>Your cart is empty</h2>
          <p className='ps-empty__text'>
            Looks like you haven't added anything yet.
          </p>
          <Link to='/' className='ps-btn ps-btn--secondary'>
            Browse products
          </Link>
        </div>
      ) : (
        <div className='ps-cart-layout'>
          {/* ── Item list ── */}
          <section aria-label='Cart items'>
            <ul className='ps-cart-items' aria-label={`${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}>
              {cartItems.map((item) => (
                <li key={item.product} className='ps-cart-item'>
                  {/* Thumbnail — decorative, name link is accessible */}
                  <Link
                    to={`/product/${item.product}`}
                    aria-hidden='true'
                    tabIndex='-1'
                  >
                    <img
                      src={item.image}
                      alt=''
                      className='ps-cart-item__img'
                      loading='lazy'
                    />
                  </Link>

                  {/* Name */}
                  <div className='ps-cart-item__info'>
                    <Link
                      to={`/product/${item.product}`}
                      className='ps-cart-item__name'
                    >
                      {item.name}
                    </Link>
                    <span className='ps-cart-item__price' aria-label={`Price: $${item.price}`}>
                      ${item.price}
                    </span>
                  </div>

                  {/* Qty select */}
                  <div className='ps-form-group' style={{ margin: 0 }}>
                    <label
                      htmlFor={`qty-${item.product}`}
                      className='ps-sr-only'
                    >
                      Quantity for {item.name}
                    </label>
                    <select
                      id={`qty-${item.product}`}
                      className='ps-select'
                      value={item.qty}
                      onChange={(e) => qtyChangeHandler(item, e.target.value)}
                      style={{ width: '72px' }}
                      aria-label={`Quantity for ${item.name}`}
                    >
                      {[...Array(item.countInStock).keys()].map((x) => (
                        <option key={x + 1} value={x + 1}>
                          {x + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Remove button */}
                  <button
                    type='button'
                    className='ps-btn--icon'
                    onClick={() => removeFromCartHandler(item.product, item.name)}
                    aria-label={`Remove ${item.name} from cart`}
                    title={`Remove ${item.name}`}
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Order summary ── */}
          <aside aria-label='Order summary'>
            <div className='ps-summary-card'>
              <h2 className='ps-summary-title'>Order Summary</h2>

              <hr className='ps-divider' />

              <div
                className='ps-summary-row'
                aria-label={`${totalItems} item${totalItems !== 1 ? 's' : ''}: $${totalPrice}`}
              >
                <span className='ps-summary-row__label'>
                  Items ({totalItems})
                </span>
                <span className='ps-summary-row__value'>${totalPrice}</span>
              </div>

              <hr className='ps-divider' />

              <button
                type='button'
                className='ps-btn ps-btn--primary'
                disabled={cartItems.length === 0}
                aria-disabled={cartItems.length === 0}
                onClick={checkoutHandler}
              >
                Proceed to Checkout
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

export default CartScreen
