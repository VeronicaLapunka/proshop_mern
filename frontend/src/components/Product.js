import React from 'react'
import { Link } from 'react-router-dom'
import Rating from './Rating'
import '../screens/screens.css'

// DESIGN_ACCESSIBILITY.md §8: image link hidden from AT (aria-hidden + tabIndex -1),
// name link is the accessible entry point.
const Product = ({ product }) => (
  <article className='ps-product-card'>
    <Link
      to={`/product/${product._id}`}
      className='ps-product-card__img-wrap'
      aria-hidden='true'
      tabIndex='-1'
    >
      <img
        src={product.image}
        alt=''
        className='ps-product-card__img'
        loading='lazy'
      />
    </Link>
    <div className='ps-product-card__body'>
      <Link
        to={`/product/${product._id}`}
        className='ps-product-card__title'
      >
        {product.name}
      </Link>
      <Rating
        value={product.rating}
        text={`${product.numReviews} reviews`}
      />
      <p className='ps-product-card__price' aria-label={`Price: $${product.price}`}>
        ${product.price}
      </p>
    </div>
  </article>
)

export default Product
