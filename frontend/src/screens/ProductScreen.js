import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Rating from '../components/Rating'
import Meta from '../components/Meta'
import {
  listProductDetails,
  createProductReview,
} from '../actions/productActions'
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants'
import './screens.css'

/*
  ASCII wireframe (ANTI_SLOP):
  [← Back]
  ┌──────────────────────┬──────────────────────────────┐
  │  Product Image       │  Product Name                │
  │                      │  ★★★★☆  12 reviews          │
  │                      │  Price: $49.99               │
  │                      │  Description…                │
  │                      ├──────────────────────────────┤
  │                      │  BUY CARD                    │
  │                      │  Price / Status / Qty        │
  │                      │  [Add to Cart ─────────────] │
  └──────────────────────┴──────────────────────────────┘
  ─── 48px gap ──
  ┌─────────────────────────┬───────────────────────────┐
  │  h2 Reviews (N)         │  h3 Write a Review        │
  │  [review list]          │  [select rating]          │
  │                         │  [textarea]               │
  │                         │  [Submit]                 │
  └─────────────────────────┴───────────────────────────┘

  User journey: interested buyer → evaluate product → Add to Cart
  Primary CTA: Add to Cart button
*/

const IconArrowLeft = () => (
  <svg
    width='16' height='16' viewBox='0 0 16 16'
    fill='none' stroke='currentColor' strokeWidth='1.5'
    strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'
  >
    <path d='M10 3L5 8L10 13' />
  </svg>
)

const Loader = () => (
  <div className='ps-loader' role='status' aria-label='Loading product…'>
    <div className='ps-loader__ring' />
  </div>
)

const ProductScreen = ({ history, match }) => {
  const [qty,     setQty]     = useState(1)
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')

  const dispatch = useDispatch()

  const productDetails = useSelector((state) => state.productDetails)
  const { loading, error, product } = productDetails

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const productReviewCreate = useSelector((state) => state.productReviewCreate)
  const {
    success:  successProductReview,
    loading:  loadingProductReview,
    error:    errorProductReview,
  } = productReviewCreate

  useEffect(() => {
    if (successProductReview) {
      setRating(0)
      setComment('')
    }
    if (!product._id || product._id !== match.params.id) {
      dispatch(listProductDetails(match.params.id))
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET })
    }
  }, [dispatch, match, successProductReview])

  const addToCartHandler = () => {
    history.push(`/cart/${match.params.id}?qty=${qty}`)
  }

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(createProductReview(match.params.id, { rating, comment }))
  }

  return (
    <>
      <Link to='/' className='ps-back'>
        <IconArrowLeft />
        Back to products
      </Link>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className='ps-alert ps-alert--error' role='alert'>{error}</div>
      ) : (
        <>
          <Meta title={product.name} />

          {/* ── Two-column product layout ── */}
          <div className='ps-product-layout'>
            {/* Left: product image */}
            <div>
              <img
                src={product.image}
                alt={`${product.name} product photo`}
                className='ps-product-img'
              />
            </div>

            {/* Right: info + buy card stacked */}
            <div className='ps-product-details'>
              <h1 className='ps-product-name'>{product.name}</h1>

              <Rating
                value={product.rating}
                text={`${product.numReviews} review${product.numReviews !== 1 ? 's' : ''}`}
              />

              <p
                className='ps-product-price-lg'
                aria-label={`Price: $${product.price}`}
              >
                ${product.price}
              </p>

              <hr className='ps-divider' />

              <p className='ps-product-desc'>{product.description}</p>

              <hr className='ps-divider' />

              {/* Buy card */}
              <div className='ps-buy-card'>
                <div className='ps-buy-row'>
                  <span className='ps-buy-row__label'>Price</span>
                  <span className='ps-buy-row__value'>${product.price}</span>
                </div>

                <div className='ps-buy-row'>
                  <span className='ps-buy-row__label'>Status</span>
                  <span
                    className={`ps-buy-row__value ${
                      product.countInStock > 0 ? 'ps-stock--in' : 'ps-stock--out'
                    }`}
                  >
                    {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                {product.countInStock > 0 && (
                  <div className='ps-form-group'>
                    <label htmlFor='product-qty' className='ps-label'>
                      Quantity
                    </label>
                    <select
                      id='product-qty'
                      className='ps-select'
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      aria-label='Select quantity'
                    >
                      {[...Array(product.countInStock).keys()].map((x) => (
                        <option key={x + 1} value={x + 1}>
                          {x + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  className='ps-btn ps-btn--primary'
                  type='button'
                  onClick={addToCartHandler}
                  disabled={product.countInStock === 0}
                  aria-disabled={product.countInStock === 0}
                >
                  {product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Reviews section — 48px top gap ── */}
          <section
            aria-labelledby='reviews-heading'
            className='ps-reviews-section ps-section'
          >
            {/* Left: existing reviews */}
            <div>
              <h2 id='reviews-heading' className='ps-reviews-heading'>
                Reviews
                {product.reviews.length > 0 && ` (${product.reviews.length})`}
              </h2>

              {product.reviews.length === 0 ? (
                <div className='ps-alert ps-alert--info' role='status'>
                  No reviews yet. Be the first to review this product.
                </div>
              ) : (
                <ul className='ps-review-list' aria-label='Customer reviews'>
                  {product.reviews.map((review) => (
                    <li key={review._id} className='ps-review'>
                      <strong className='ps-review__author'>{review.name}</strong>
                      <p className='ps-review__date'>
                        {review.createdAt.substring(0, 10)}
                      </p>
                      <Rating value={review.rating} />
                      <p className='ps-review__text'>{review.comment}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Right: write a review */}
            <div>
              <h3 className='ps-review-form-heading'>Write a Review</h3>

              {successProductReview && (
                <div className='ps-alert ps-alert--success' role='status' aria-live='polite'>
                  Review submitted successfully.
                </div>
              )}
              {errorProductReview && (
                <div className='ps-alert ps-alert--error' role='alert'>
                  {errorProductReview}
                </div>
              )}

              {userInfo ? (
                <form onSubmit={submitHandler} noValidate>
                  <div className='ps-form-group' style={{ marginBottom: 'var(--ps-space-5)' }}>
                    <label htmlFor='review-rating' className='ps-label'>
                      Rating <span className='ps-required' aria-label='required'>*</span>
                    </label>
                    <select
                      id='review-rating'
                      className='ps-select'
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      required
                      aria-required='true'
                    >
                      <option value=''>Select a rating…</option>
                      <option value='1'>1 — Poor</option>
                      <option value='2'>2 — Fair</option>
                      <option value='3'>3 — Good</option>
                      <option value='4'>4 — Very Good</option>
                      <option value='5'>5 — Excellent</option>
                    </select>
                  </div>

                  <div className='ps-form-group' style={{ marginBottom: 'var(--ps-space-5)' }}>
                    <label htmlFor='review-comment' className='ps-label'>
                      Comment
                    </label>
                    <textarea
                      id='review-comment'
                      className='ps-textarea'
                      rows='4'
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <button
                    type='submit'
                    className='ps-btn ps-btn--primary'
                    disabled={loadingProductReview}
                    aria-busy={loadingProductReview}
                    style={{ width: 'auto', paddingLeft: 'var(--ps-space-6)', paddingRight: 'var(--ps-space-6)' }}
                  >
                    {loadingProductReview ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <div className='ps-alert ps-alert--info'>
                  Please <Link to='/login'>sign in</Link> to write a review.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  )
}

export default ProductScreen
