import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Product from '../components/Product'
import Paginate from '../components/Paginate'
import ProductCarousel from '../components/ProductCarousel'
import Meta from '../components/Meta'
import { listProducts } from '../actions/productActions'
import './screens.css'

/*
  ASCII wireframe (ANTI_SLOP):
  [Hero carousel ≤60vh]          (home only, no keyword)
  [← Back to results]            (search only)
  ─────────────────────────────────────── 48px gap
  h1: Latest Products / Results for "…"
  [product card] [product card] [product card] [product card]   auto-fill grid
  [product card] [product card] …
  ─────────────────────────────────────── 48px gap
  [pagination]

  User journey: browsing visitor → find product → click through → product page
  Primary CTA: product card (name link)
*/

// Inline SVG back arrow — no emoji per ANTI_SLOP
const IconArrowLeft = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M10 3L5 8L10 13' />
  </svg>
)

const Loader = () => (
  <div className='ps-loader' role='status' aria-label='Loading products…'>
    <div className='ps-loader__ring' />
  </div>
)

const HomeScreen = ({ match }) => {
  const keyword    = match.params.keyword
  const pageNumber = match.params.pageNumber || 1

  const dispatch = useDispatch()

  const productList = useSelector((state) => state.productList)
  const { loading, error, products, page, pages } = productList

  // Live region announcement for screen readers (WCAG 4.1.3)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    dispatch(listProducts(keyword, pageNumber))
  }, [dispatch, keyword, pageNumber])

  useEffect(() => {
    if (!loading && products) {
      setAnnouncement(
        keyword
          ? `Search results for "${keyword}": ${products.length} products found.`
          : `Showing ${products.length} products.`
      )
    }
  }, [loading, products, keyword])

  return (
    <>
      <Meta />

      {/* WCAG 4.1.3 — live region for dynamic content announcements */}
      <div
        role='status'
        aria-live='polite'
        aria-atomic='true'
        className='ps-live-region'
      >
        {announcement}
      </div>

      {/* Hero carousel (home only) — ANTI_SLOP: max 60vh */}
      {!keyword ? (
        <div className='ps-hero'>
          <ProductCarousel />
        </div>
      ) : (
        <Link to='/' className='ps-back'>
          <IconArrowLeft />
          Back to all products
        </Link>
      )}

      {/* Products section — ANTI_SLOP: 48px top gap via ps-section */}
      <section
        aria-labelledby='products-heading'
        className={keyword ? '' : 'ps-section'}
      >
        <h1 id='products-heading' className='ps-section-title'>
          {keyword ? `Results for "${keyword}"` : 'Latest Products'}
        </h1>

        {loading ? (
          <Loader />
        ) : error ? (
          <div className='ps-alert ps-alert--error' role='alert'>
            {error}
          </div>
        ) : (
          <>
            {products.length === 0 ? (
              <div className='ps-alert ps-alert--info' role='status'>
                No products found{keyword ? ` for "${keyword}"` : ''}.{' '}
                <Link to='/'>Browse all products</Link>
              </div>
            ) : (
              /* role="list" so product cards are announced as a list to screen readers */
              <div className='ps-grid' role='list' aria-label='Products'>
                {products.map((product) => (
                  <div role='listitem' key={product._id}>
                    <Product product={product} />
                  </div>
                ))}
              </div>
            )}

            <Paginate pages={pages} page={page} keyword={keyword || ''} />
          </>
        )}
      </section>
    </>
  )
}

export default HomeScreen
