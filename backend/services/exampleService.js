/**
 * productService.js - Product business logic extracted from controllers
 *
 * ProShop service layer pattern:
 * - Controllers handle HTTP requests/responses + status codes
 * - Services contain reusable business logic
 * - Models handle database operations
 *
 * All async service functions must be wrapped with asyncHandler when used in controllers.
 * Services throw errors naturally; controllers catch + format responses.
 */

/**
 * Calculate product reviews aggregation (rating + count)
 * Returns the average rating and total review count
 * Used in createProductReview and product detail endpoints
 * @param {Array} reviews - Array of review objects with rating field
 * @returns {Object} { rating, numReviews }
 */
const calculateProductRating = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return { rating: 0, numReviews: 0 }
  }

  const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0)
  const avgRating = totalRating / reviews.length

  return {
    rating: avgRating,
    numReviews: reviews.length,
  }
}

/**
 * Validate product input for create/update operations
 * Ensures all required fields are present and valid
 * @param {Object} productData - Product fields: name, price, description, etc.
 * @returns {Array} Array of validation error strings (empty if valid)
 */
const validateProductInput = (productData) => {
  const errors = []

  if (!productData.name || productData.name.trim().length === 0) {
    errors.push('Product name is required')
  }

  if (productData.price === undefined || productData.price < 0) {
    errors.push('Product price must be a non-negative number')
  }

  if (!productData.description || productData.description.trim().length === 0) {
    errors.push('Product description is required')
  }

  if (!productData.brand || productData.brand.trim().length === 0) {
    errors.push('Product brand is required')
  }

  if (!productData.category || productData.category.trim().length === 0) {
    errors.push('Product category is required')
  }

  if (productData.countInStock === undefined || productData.countInStock < 0) {
    errors.push('Product stock count must be a non-negative number')
  }

  return errors
}

/**
 * Check if user has already reviewed a product
 * Used to prevent duplicate reviews
 * @param {Array} reviews - Array of review objects
 * @param {String} userId - Mongoose ObjectId of user
 * @returns {Boolean} true if user has reviewed
 */
const userAlreadyReviewed = (reviews, userId) => {
  return reviews.some((r) => r.user.toString() === userId.toString())
}

export {
  calculateProductRating,
  validateProductInput,
  userAlreadyReviewed,
}
