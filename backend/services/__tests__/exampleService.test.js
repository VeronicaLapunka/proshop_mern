/**
 * Unit tests for backend/services/exampleService.js
 *
 * Run from repo root:
 *   NODE_OPTIONS=--experimental-vm-modules npx jest backend/services/__tests__/
 *
 * Project uses ESM ("type": "module") + jest@30. Local imports require .js extension.
 */

import {
  calculateProductRating,
  validateProductInput,
  userAlreadyReviewed,
} from '../exampleService.js'

// -----------------------------------------------------------------------------
// calculateProductRating
// -----------------------------------------------------------------------------
describe('calculateProductRating', () => {
  test('returns_average_rating_4_for_reviews_with_5_and_3', () => {
    const result = calculateProductRating([{ rating: 5 }, { rating: 3 }])
    expect(result.rating).toBe(4)
    expect(result.numReviews).toBe(2)
  })

  test('returns_rating_4_and_count_1_for_single_review', () => {
    const result = calculateProductRating([{ rating: 4 }])
    expect(result.rating).toBe(4)
    expect(result.numReviews).toBe(1)
  })

  test('returns_rating_3_when_all_reviews_have_same_rating_3', () => {
    const result = calculateProductRating([{ rating: 3 }, { rating: 3 }])
    expect(result.rating).toBe(3)
    expect(result.numReviews).toBe(2)
  })

  test('returns_zero_rating_and_zero_count_for_empty_array', () => {
    const result = calculateProductRating([])
    expect(result.rating).toBe(0)
    expect(result.numReviews).toBe(0)
  })

  test('returns_zero_rating_and_zero_count_for_null_input', () => {
    const result = calculateProductRating(null)
    expect(result.rating).toBe(0)
    expect(result.numReviews).toBe(0)
  })

  test('returns_zero_rating_and_zero_count_for_undefined_input', () => {
    const result = calculateProductRating(undefined)
    expect(result.rating).toBe(0)
    expect(result.numReviews).toBe(0)
  })

  test('returns_fractional_average_1_5_for_ratings_1_and_2', () => {
    const result = calculateProductRating([{ rating: 1 }, { rating: 2 }])
    expect(result.rating).toBe(1.5)
    expect(result.numReviews).toBe(2)
  })

  test('returns_rating_5_and_count_100_for_100_reviews_all_rated_5', () => {
    const reviews = Array.from({ length: 100 }, () => ({ rating: 5 }))
    const result = calculateProductRating(reviews)
    expect(result.rating).toBe(5)
    expect(result.numReviews).toBe(100)
  })

  test('returns_rating_3_for_mixed_extreme_ratings_1_and_5', () => {
    const result = calculateProductRating([{ rating: 1 }, { rating: 5 }])
    expect(result.rating).toBe(3)
    expect(result.numReviews).toBe(2)
  })
})

// -----------------------------------------------------------------------------
// validateProductInput
// -----------------------------------------------------------------------------
describe('validateProductInput', () => {
  const validProduct = {
    name: 'Canon EOS R5 Mirrorless Camera',
    price: 3899.99,
    description: 'Full-frame mirrorless with 45MP sensor and 8K video',
    brand: 'Canon',
    category: 'Electronics',
    countInStock: 12,
  }

  test('returns_empty_array_for_fully_valid_product', () => {
    const errors = validateProductInput(validProduct)
    expect(errors).toEqual([])
    expect(errors).toHaveLength(0)
  })

  test('returns_error_when_name_is_missing', () => {
    const { name, ...rest } = validProduct
    const errors = validateProductInput(rest)
    expect(errors).toContain('Product name is required')
  })

  test('returns_error_when_name_is_only_whitespace', () => {
    const errors = validateProductInput({ ...validProduct, name: '   ' })
    expect(errors).toContain('Product name is required')
  })

  test('returns_error_when_name_is_empty_string', () => {
    const errors = validateProductInput({ ...validProduct, name: '' })
    expect(errors).toContain('Product name is required')
  })

  test('returns_error_when_price_is_negative', () => {
    const errors = validateProductInput({ ...validProduct, price: -1 })
    expect(errors).toContain('Product price must be a non-negative number')
  })

  test('returns_error_when_price_is_undefined', () => {
    const { price, ...rest } = validProduct
    const errors = validateProductInput(rest)
    expect(errors).toContain('Product price must be a non-negative number')
  })

  test('accepts_price_of_zero_as_valid', () => {
    const errors = validateProductInput({ ...validProduct, price: 0 })
    expect(errors).not.toContain('Product price must be a non-negative number')
    expect(errors).toHaveLength(0)
  })

  test('returns_error_when_description_is_missing', () => {
    const { description, ...rest } = validProduct
    const errors = validateProductInput(rest)
    expect(errors).toContain('Product description is required')
  })

  test('returns_error_when_description_is_only_whitespace', () => {
    const errors = validateProductInput({ ...validProduct, description: '   \t\n  ' })
    expect(errors).toContain('Product description is required')
  })

  test('returns_error_when_brand_is_missing', () => {
    const { brand, ...rest } = validProduct
    const errors = validateProductInput(rest)
    expect(errors).toContain('Product brand is required')
  })

  test('returns_error_when_brand_is_only_whitespace', () => {
    const errors = validateProductInput({ ...validProduct, brand: '  ' })
    expect(errors).toContain('Product brand is required')
  })

  test('returns_error_when_category_is_missing', () => {
    const { category, ...rest } = validProduct
    const errors = validateProductInput(rest)
    expect(errors).toContain('Product category is required')
  })

  test('returns_error_when_category_is_only_whitespace', () => {
    const errors = validateProductInput({ ...validProduct, category: '   ' })
    expect(errors).toContain('Product category is required')
  })

  test('returns_error_when_countInStock_is_negative', () => {
    const errors = validateProductInput({ ...validProduct, countInStock: -5 })
    expect(errors).toContain('Product stock count must be a non-negative number')
  })

  test('returns_error_when_countInStock_is_undefined', () => {
    const { countInStock, ...rest } = validProduct
    const errors = validateProductInput(rest)
    expect(errors).toContain('Product stock count must be a non-negative number')
  })

  test('accepts_countInStock_of_zero_as_valid', () => {
    const errors = validateProductInput({ ...validProduct, countInStock: 0 })
    expect(errors).not.toContain('Product stock count must be a non-negative number')
    expect(errors).toHaveLength(0)
  })

  test('returns_multiple_errors_when_multiple_required_fields_missing', () => {
    const errors = validateProductInput({
      name: '',
      description: '',
      brand: '',
      // price, category, countInStock all missing too
    })
    // name + price + description + brand + category + countInStock = 6 errors
    expect(errors.length).toBeGreaterThanOrEqual(3)
    expect(errors).toContain('Product name is required')
    expect(errors).toContain('Product description is required')
    expect(errors).toContain('Product brand is required')
    expect(errors).toContain('Product price must be a non-negative number')
    expect(errors).toContain('Product category is required')
    expect(errors).toContain('Product stock count must be a non-negative number')
  })

  test('returns_empty_array_when_extra_unknown_fields_present_with_required_fields_valid', () => {
    const errors = validateProductInput({
      ...validProduct,
      somethingExtra: 'ignore me',
      sku: 'XYZ-123',
      tags: ['a', 'b'],
    })
    expect(errors).toEqual([])
    expect(errors).toHaveLength(0)
  })

  test('returns_only_price_error_when_only_price_is_invalid', () => {
    const errors = validateProductInput({ ...validProduct, price: -0.01 })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toBe('Product price must be a non-negative number')
  })
})

// -----------------------------------------------------------------------------
// userAlreadyReviewed
// -----------------------------------------------------------------------------
describe('userAlreadyReviewed', () => {
  // Mimic Mongoose ObjectId behaviour: toString() returns the hex string
  const makeObjectId = (hex) => ({
    _hex: hex,
    toString() {
      return this._hex
    },
  })

  test('returns_true_when_userId_matches_one_review', () => {
    const userA = '507f1f77bcf86cd799439011'
    const reviews = [
      { user: '507f1f77bcf86cd799439099' },
      { user: userA },
    ]
    expect(userAlreadyReviewed(reviews, userA)).toBe(true)
  })

  test('returns_false_when_userId_not_in_any_review', () => {
    const reviews = [
      { user: '507f1f77bcf86cd799439001' },
      { user: '507f1f77bcf86cd799439002' },
    ]
    expect(userAlreadyReviewed(reviews, '507f1f77bcf86cd7994390ff')).toBe(false)
  })

  test('returns_false_when_reviews_array_is_empty', () => {
    expect(userAlreadyReviewed([], '507f1f77bcf86cd799439011')).toBe(false)
  })

  test('returns_true_when_review_user_is_objectId_and_userId_is_string', () => {
    const hex = '507f1f77bcf86cd799439011'
    const reviews = [{ user: makeObjectId(hex) }]
    expect(userAlreadyReviewed(reviews, hex)).toBe(true)
  })

  test('returns_true_when_both_review_user_and_userId_are_strings', () => {
    const hex = '507f1f77bcf86cd799439011'
    const reviews = [{ user: hex }]
    expect(userAlreadyReviewed(reviews, hex)).toBe(true)
  })

  test('returns_true_when_only_last_review_in_list_matches_userId', () => {
    const target = '507f1f77bcf86cd799439055'
    const reviews = [
      { user: '507f1f77bcf86cd799439001' },
      { user: '507f1f77bcf86cd799439002' },
      { user: '507f1f77bcf86cd799439003' },
      { user: target },
    ]
    expect(userAlreadyReviewed(reviews, target)).toBe(true)
  })

  test('returns_true_when_review_user_is_string_and_userId_is_objectId', () => {
    const hex = '507f1f77bcf86cd799439011'
    const reviews = [{ user: hex }]
    expect(userAlreadyReviewed(reviews, makeObjectId(hex))).toBe(true)
  })

  test('returns_false_when_hex_strings_differ_by_one_character', () => {
    const reviews = [{ user: '507f1f77bcf86cd799439011' }]
    expect(userAlreadyReviewed(reviews, '507f1f77bcf86cd799439012')).toBe(false)
  })
})
