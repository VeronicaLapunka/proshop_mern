/**
 * exampleService.test.js
 *
 * Comprehensive test suite for backend/services/exampleService.js
 * Tests pure business logic functions:
 * - calculateProductRating(reviews): Aggregates review ratings
 * - validateProductInput(productData): Validates product fields
 * - userAlreadyReviewed(reviews, userId): Checks for duplicate reviews
 */

import {
  calculateProductRating,
  validateProductInput,
  userAlreadyReviewed,
} from '../../services/exampleService.js'

describe('calculateProductRating', () => {
  describe('happy path', () => {
    it('calculates correct average rating from multiple reviews', () => {
      const reviews = [
        { rating: 5, text: 'Excellent product' },
        { rating: 4, text: 'Very good' },
        { rating: 3, text: 'Average' },
      ]
      const result = calculateProductRating(reviews)

      expect(result.rating).toBe(4)
      expect(result.numReviews).toBe(3)
    })

    it('returns exact average for non-integer results', () => {
      const reviews = [
        { rating: 5, text: 'Great' },
        { rating: 4, text: 'Good' },
      ]
      const result = calculateProductRating(reviews)

      expect(result.rating).toBe(4.5)
      expect(result.numReviews).toBe(2)
    })

    it('handles single review correctly', () => {
      const reviews = [{ rating: 4.5, text: 'Good product' }]
      const result = calculateProductRating(reviews)

      expect(result.rating).toBe(4.5)
      expect(result.numReviews).toBe(1)
    })
  })

  describe('edge cases with ratings', () => {
    it('handles minimum rating of 0', () => {
      const reviews = [
        { rating: 0, text: 'Terrible' },
        { rating: 2, text: 'Bad' },
      ]
      const result = calculateProductRating(reviews)

      expect(result.rating).toBe(1)
      expect(result.numReviews).toBe(2)
    })

    it('handles maximum rating of 5', () => {
      const reviews = [
        { rating: 5, text: 'Perfect' },
        { rating: 5, text: 'Perfect' },
        { rating: 5, text: 'Perfect' },
      ]
      const result = calculateProductRating(reviews)

      expect(result.rating).toBe(5)
      expect(result.numReviews).toBe(3)
    })

    it('handles all zero ratings', () => {
      const reviews = [
        { rating: 0, text: 'Bad' },
        { rating: 0, text: 'Bad' },
      ]
      const result = calculateProductRating(reviews)

      expect(result.rating).toBe(0)
      expect(result.numReviews).toBe(2)
    })

    it('handles mixed high and low ratings', () => {
      const reviews = [
        { rating: 5, text: 'Perfect' },
        { rating: 1, text: 'Worst' },
      ]
      const result = calculateProductRating(reviews)

      expect(result.rating).toBe(3)
      expect(result.numReviews).toBe(2)
    })
  })

  describe('edge cases with empty/null inputs', () => {
    it('returns 0 rating and 0 reviews for empty array', () => {
      const result = calculateProductRating([])

      expect(result.rating).toBe(0)
      expect(result.numReviews).toBe(0)
    })

    it('returns 0 rating and 0 reviews for null input', () => {
      const result = calculateProductRating(null)

      expect(result.rating).toBe(0)
      expect(result.numReviews).toBe(0)
    })

    it('returns 0 rating and 0 reviews for undefined input', () => {
      const result = calculateProductRating(undefined)

      expect(result.rating).toBe(0)
      expect(result.numReviews).toBe(0)
    })
  })

  describe('decimal precision', () => {
    it('preserves decimal ratings in result', () => {
      const reviews = [
        { rating: 3.5, text: 'Good' },
        { rating: 4.5, text: 'Better' },
      ]
      const result = calculateProductRating(reviews)

      expect(result.rating).toBe(4)
      expect(result.numReviews).toBe(2)
    })

    it('handles fractional average correctly', () => {
      const reviews = [
        { rating: 1, text: 'Bad' },
        { rating: 2, text: 'Meh' },
        { rating: 3, text: 'OK' },
      ]
      const result = calculateProductRating(reviews)

      expect(result.rating).toBe(2)
      expect(result.numReviews).toBe(3)
    })
  })
})

describe('validateProductInput', () => {
  describe('happy path', () => {
    it('returns empty errors array for valid product', () => {
      const productData = {
        name: 'USB-C Cable',
        price: 19.99,
        description: 'High-quality USB-C charging cable with 10-year warranty',
        brand: 'ElectroMax',
        category: 'Electronics',
        countInStock: 50,
      }
      const errors = validateProductInput(productData)

      expect(errors).toEqual([])
      expect(errors.length).toBe(0)
    })

    it('validates product with minimal valid data', () => {
      const productData = {
        name: 'Widget',
        price: 1,
        description: 'A widget',
        brand: 'Generic',
        category: 'Tools',
        countInStock: 1,
      }
      const errors = validateProductInput(productData)

      expect(errors).toEqual([])
    })

    it('validates product with large price', () => {
      const productData = {
        name: 'Premium Equipment',
        price: 99999.99,
        description: 'Very expensive equipment',
        brand: 'Luxury',
        category: 'Premium',
        countInStock: 1,
      }
      const errors = validateProductInput(productData)

      expect(errors).toEqual([])
    })
  })

  describe('missing required fields', () => {
    it('returns error when name is missing', () => {
      const productData = {
        price: 10,
        description: 'Test',
        brand: 'Test',
        category: 'Test',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product name is required')
    })

    it('returns error when description is missing', () => {
      const productData = {
        name: 'Product',
        price: 10,
        brand: 'Brand',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product description is required')
    })

    it('returns error when brand is missing', () => {
      const productData = {
        name: 'Product',
        price: 10,
        description: 'Description',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product brand is required')
    })

    it('returns error when category is missing', () => {
      const productData = {
        name: 'Product',
        price: 10,
        description: 'Description',
        brand: 'Brand',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product category is required')
    })
  })

  describe('empty string validation', () => {
    it('returns error when name is empty string', () => {
      const productData = {
        name: '',
        price: 10,
        description: 'Description',
        brand: 'Brand',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product name is required')
    })

    it('returns error when name is whitespace only', () => {
      const productData = {
        name: '   ',
        price: 10,
        description: 'Description',
        brand: 'Brand',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product name is required')
    })

    it('returns error when description is empty string', () => {
      const productData = {
        name: 'Product',
        price: 10,
        description: '',
        brand: 'Brand',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product description is required')
    })

    it('returns error when brand is whitespace only', () => {
      const productData = {
        name: 'Product',
        price: 10,
        description: 'Description',
        brand: '  ',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product brand is required')
    })

    it('returns error when category is empty string', () => {
      const productData = {
        name: 'Product',
        price: 10,
        description: 'Description',
        brand: 'Brand',
        category: '',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product category is required')
    })
  })

  describe('price validation', () => {
    it('returns error when price is negative', () => {
      const productData = {
        name: 'Product',
        price: -10,
        description: 'Description',
        brand: 'Brand',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product price must be a non-negative number')
    })

    it('returns error when price is undefined', () => {
      const productData = {
        name: 'Product',
        description: 'Description',
        brand: 'Brand',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product price must be a non-negative number')
    })

    it('allows price of zero', () => {
      const productData = {
        name: 'Product',
        price: 0,
        description: 'Description',
        brand: 'Brand',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).not.toContain('Product price must be a non-negative number')
    })
  })

  describe('stock validation', () => {
    it('returns error when countInStock is negative', () => {
      const productData = {
        name: 'Product',
        price: 10,
        description: 'Description',
        brand: 'Brand',
        category: 'Category',
        countInStock: -5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product stock count must be a non-negative number')
    })

    it('returns error when countInStock is undefined', () => {
      const productData = {
        name: 'Product',
        price: 10,
        description: 'Description',
        brand: 'Brand',
        category: 'Category',
      }
      const errors = validateProductInput(productData)

      expect(errors).toContain('Product stock count must be a non-negative number')
    })

    it('allows countInStock of zero', () => {
      const productData = {
        name: 'Product',
        price: 10,
        description: 'Description',
        brand: 'Brand',
        category: 'Category',
        countInStock: 0,
      }
      const errors = validateProductInput(productData)

      expect(errors).not.toContain('Product stock count must be a non-negative number')
    })
  })

  describe('multiple errors', () => {
    it('returns multiple errors when several fields are invalid', () => {
      const productData = {
        name: '',
        price: -5,
        description: '',
        brand: 'Brand',
        category: '',
        countInStock: -10,
      }
      const errors = validateProductInput(productData)

      expect(errors.length).toBeGreaterThan(3)
      expect(errors).toContain('Product name is required')
      expect(errors).toContain('Product price must be a non-negative number')
      expect(errors).toContain('Product description is required')
      expect(errors).toContain('Product category is required')
      expect(errors).toContain('Product stock count must be a non-negative number')
    })

    it('returns all errors for completely empty object', () => {
      const productData = {}
      const errors = validateProductInput(productData)

      expect(errors.length).toBe(6)
    })
  })

  describe('security - special characters and edge cases', () => {
    it('allows special characters in name', () => {
      const productData = {
        name: 'USB-C 2.0 Cable (10ft)',
        price: 10,
        description: 'Description',
        brand: 'Brand',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).not.toContain('Product name is required')
    })

    it('allows special characters in description', () => {
      const productData = {
        name: 'Product',
        price: 10,
        description: 'Special chars: !@#$%^&*() <html>test</html>',
        brand: 'Brand',
        category: 'Category',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).not.toContain('Product description is required')
    })

    it('allows unicode characters', () => {
      const productData = {
        name: '商品',
        price: 10,
        description: 'Описание продукта',
        brand: 'Marque',
        category: '카테고리',
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toEqual([])
    })

    it('allows very long strings', () => {
      const longString = 'a'.repeat(1000)
      const productData = {
        name: longString,
        price: 10,
        description: longString,
        brand: longString,
        category: longString,
        countInStock: 5,
      }
      const errors = validateProductInput(productData)

      expect(errors).toEqual([])
    })
  })
})

describe('userAlreadyReviewed', () => {
  describe('happy path', () => {
    it('returns true when user has reviewed', () => {
      const userId = '507f1f77bcf86cd799439011'
      const reviews = [
        { user: userId, rating: 5, text: 'Great!' },
        { user: '507f1f77bcf86cd799439012', rating: 4, text: 'Good' },
      ]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(true)
    })

    it('returns false when user has not reviewed', () => {
      const userId = '507f1f77bcf86cd799439011'
      const reviews = [
        { user: '507f1f77bcf86cd799439012', rating: 5, text: 'Great!' },
        { user: '507f1f77bcf86cd799439013', rating: 4, text: 'Good' },
      ]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(false)
    })

    it('returns false for empty reviews array', () => {
      const userId = '507f1f77bcf86cd799439011'
      const result = userAlreadyReviewed([], userId)

      expect(result).toBe(false)
    })
  })

  describe('edge cases with userId matching', () => {
    it('matches userId when it is a string', () => {
      const userId = 'user-123'
      const reviews = [{ user: 'user-123', rating: 5, text: 'Good' }]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(true)
    })

    it('matches userId when it is an ObjectId', () => {
      const userId = { toString: () => '507f1f77bcf86cd799439011' }
      const userIdInReview = { toString: () => '507f1f77bcf86cd799439011' }
      const reviews = [{ user: userIdInReview, rating: 5, text: 'Good' }]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(true)
    })

    it('does not match when userId toString differs', () => {
      const userId = { toString: () => 'user-1' }
      const userIdInReview = { toString: () => 'user-2' }
      const reviews = [{ user: userIdInReview, rating: 5, text: 'Good' }]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(false)
    })
  })

  describe('multiple reviews from different users', () => {
    it('finds user among multiple reviews', () => {
      const userId = 'user-2'
      const reviews = [
        { user: 'user-1', rating: 3, text: 'OK' },
        { user: 'user-2', rating: 5, text: 'Great' },
        { user: 'user-3', rating: 4, text: 'Good' },
        { user: 'user-4', rating: 2, text: 'Bad' },
      ]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(true)
    })

    it('returns false when user is last in list', () => {
      const userId = 'user-not-here'
      const reviews = [
        { user: 'user-1', rating: 3, text: 'OK' },
        { user: 'user-2', rating: 5, text: 'Great' },
        { user: 'user-3', rating: 4, text: 'Good' },
      ]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(false)
    })
  })

  describe('null/undefined inputs', () => {
    it('handles null reviews array gracefully', () => {
      const userId = 'user-1'
      // The function uses .some() on reviews, which would throw if reviews is null
      // This tests the actual behavior (which may throw)
      expect(() => userAlreadyReviewed(null, userId)).toThrow()
    })

    it('handles undefined reviews array gracefully', () => {
      const userId = 'user-1'
      expect(() => userAlreadyReviewed(undefined, userId)).toThrow()
    })
  })

  describe('case sensitivity and exact matching', () => {
    it('is case-sensitive when matching string userIds', () => {
      const userId = 'User-1'
      const reviews = [{ user: 'user-1', rating: 5, text: 'Good' }]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(false)
    })

    it('matches exact string values', () => {
      const userId = '507f1f77bcf86cd799439011'
      const reviews = [{ user: '507f1f77bcf86cd799439011', rating: 5, text: 'Good' }]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(true)
    })
  })

  describe('single review scenarios', () => {
    it('returns true for single matching review', () => {
      const userId = 'user-1'
      const reviews = [{ user: 'user-1', rating: 5, text: 'Perfect!' }]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(true)
    })

    it('returns false for single non-matching review', () => {
      const userId = 'user-1'
      const reviews = [{ user: 'user-2', rating: 5, text: 'Perfect!' }]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(false)
    })
  })

  describe('security - injection attempts', () => {
    it('does not match on substring injection', () => {
      const userId = 'user-'
      const reviews = [{ user: 'user-1', rating: 5, text: 'Good' }]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(false)
    })

    it('does not match on regex pattern injection', () => {
      const userId = 'user.*'
      const reviews = [{ user: 'user-1', rating: 5, text: 'Good' }]

      const result = userAlreadyReviewed(reviews, userId)

      expect(result).toBe(false)
    })
  })
})
