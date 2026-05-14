import React from 'react'
import { Link } from 'react-router-dom'
import '../screens/screens.css'

const Paginate = ({ pages, page, isAdmin = false, keyword = '' }) => {
  if (pages <= 1) return null

  return (
    <nav aria-label='Product pages' className='ps-pagination'>
      {[...Array(pages).keys()].map((x) => {
        const pageNum = x + 1
        const to = !isAdmin
          ? keyword
            ? `/search/${keyword}/page/${pageNum}`
            : `/page/${pageNum}`
          : `/admin/productlist/${pageNum}`

        return pageNum === page ? (
          <span
            key={pageNum}
            className='ps-page-btn ps-page-btn--active'
            aria-current='page'
            aria-label={`Page ${pageNum}, current page`}
          >
            {pageNum}
          </span>
        ) : (
          <Link
            key={pageNum}
            to={to}
            className='ps-page-btn'
            aria-label={`Go to page ${pageNum}`}
          >
            {pageNum}
          </Link>
        )
      })}
    </nav>
  )
}

export default Paginate
