import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import axios from 'axios'
import { payOrder } from './refactored.js'
import {
  ORDER_PAY_REQUEST,
  ORDER_PAY_SUCCESS,
  ORDER_PAY_FAIL,
} from '../../frontend/src/constants/orderConstants.js'
import * as userActions from '../../frontend/src/actions/userActions.js'

jest.mock('axios')
jest.mock('../../frontend/src/actions/userActions.js')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('payOrder action creator (refactored)', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('happy path', () => {
    it('dispatches REQUEST, then SUCCESS with data from API', async () => {
      const orderId = '123'
      const paymentResult = { id: 'PAY-123', status: 'COMPLETED' }
      const responseData = {
        _id: '123',
        isPaid: true,
        paidAt: '2026-04-25T10:00:00Z',
      }

      axios.put.mockResolvedValue({ data: responseData })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'abc123token', _id: 'user1', name: 'John' },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: ORDER_PAY_REQUEST })
      expect(actions[1]).toEqual({
        type: ORDER_PAY_SUCCESS,
        payload: responseData,
      })

      expect(axios.put).toHaveBeenCalledWith(
        '/api/orders/123/pay',
        paymentResult,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer abc123token',
          },
        }
      )
    })
  })

  describe('API errors with response.data.message', () => {
    it('dispatches REQUEST, then FAIL with message from response', async () => {
      const orderId = '456'
      const paymentResult = {}
      const errorMessage = 'Payment declined by processor'

      axios.put.mockRejectedValue({
        response: {
          data: { message: errorMessage },
        },
      })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: ORDER_PAY_REQUEST })
      expect(actions[1]).toEqual({
        type: ORDER_PAY_FAIL,
        payload: errorMessage,
      })

      expect(userActions.logout).not.toHaveBeenCalled()
    })

    it('triggers logout if message is exactly "Not authorized, token failed"', async () => {
      const orderId = '789'
      const paymentResult = {}

      axios.put.mockRejectedValue({
        response: {
          data: { message: 'Not authorized, token failed' },
        },
      })

      userActions.logout.mockReturnValue({ type: 'USER_LOGOUT' })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'expired_token' },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: ORDER_PAY_REQUEST })
      expect(actions[1]).toEqual({ type: 'USER_LOGOUT' })
      expect(actions[2]).toEqual({
        type: ORDER_PAY_FAIL,
        payload: 'Not authorized, token failed',
      })

      expect(userActions.logout).toHaveBeenCalled()
    })

    it('does NOT logout if message contains but is not exactly "Not authorized, token failed"', async () => {
      const orderId = '999'
      const paymentResult = {}

      axios.put.mockRejectedValue({
        response: {
          data: { message: 'Error: Not authorized, token failed validation' },
        },
      })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token' },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      const actions = store.getActions()
      expect(actions).toHaveLength(2)
      expect(actions[1].payload).toBe(
        'Error: Not authorized, token failed validation'
      )
      expect(userActions.logout).not.toHaveBeenCalled()
    })
  })

  describe('API errors without response.data.message', () => {
    it('falls back to error.message when no response data', async () => {
      const orderId = '111'
      const paymentResult = {}
      const errorMessage = 'Network timeout'

      axios.put.mockRejectedValue(new Error(errorMessage))

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: ORDER_PAY_REQUEST })
      expect(actions[1]).toEqual({
        type: ORDER_PAY_FAIL,
        payload: errorMessage,
      })
    })

    it('crashes when accessing undefined response.data.message (buggy error extraction)', async () => {
      const orderId = '222'
      const paymentResult = {}

      axios.put.mockRejectedValue({
        response: { status: 500 },
        message: 'Server error',
      })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      try {
        await store.dispatch(payOrder(orderId, paymentResult))
        fail('Expected dispatch to throw or dispatch FAIL action')
      } catch (e) {
        expect(e.message).toContain("Cannot read")
      }
    })

    it('does not logout when error message does not exactly match', async () => {
      const orderId = '333'
      const paymentResult = {}

      axios.put.mockRejectedValue(new Error('Some other error'))

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      expect(userActions.logout).not.toHaveBeenCalled()
    })
  })

  describe('missing/null inputs', () => {
    it('passes null orderId to URL (becomes /api/orders/null/pay)', async () => {
      const paymentResult = { id: 'pay-123' }

      axios.put.mockResolvedValue({ data: { isPaid: true } })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(null, paymentResult))

      expect(axios.put).toHaveBeenCalledWith(
        '/api/orders/null/pay',
        paymentResult,
        expect.any(Object)
      )
    })

    it('passes undefined orderId to URL (becomes /api/orders/undefined/pay)', async () => {
      const paymentResult = { id: 'pay-123' }

      axios.put.mockResolvedValue({ data: { isPaid: true } })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(undefined, paymentResult))

      expect(axios.put).toHaveBeenCalledWith(
        '/api/orders/undefined/pay',
        paymentResult,
        expect.any(Object)
      )
    })

    it('sends undefined paymentResult to API (axios will send as undefined body)', async () => {
      const orderId = '444'

      axios.put.mockResolvedValue({ data: { isPaid: true } })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(orderId, undefined))

      expect(axios.put).toHaveBeenCalledWith(
        '/api/orders/444/pay',
        undefined,
        expect.any(Object)
      )
    })

    it('dispatches REQUEST and FAIL when userInfo is missing', async () => {
      const orderId = '555'
      const paymentResult = {}

      const store = mockStore({
        userLogin: {
          userInfo: undefined,
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: ORDER_PAY_REQUEST })
      expect(actions[1].type).toBe(ORDER_PAY_FAIL)
      expect(actions[1].payload).toContain("Cannot read")
    })

    it('dispatches REQUEST and FAIL when userLogin is missing from state', async () => {
      const orderId = '666'
      const paymentResult = {}

      const store = mockStore({})

      await store.dispatch(payOrder(orderId, paymentResult))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: ORDER_PAY_REQUEST })
      expect(actions[1].type).toBe(ORDER_PAY_FAIL)
      expect(actions[1].payload).toContain("Cannot read")
    })
  })

  describe('edge cases with paymentResult', () => {
    it('accepts empty object as paymentResult', async () => {
      const orderId = '777'
      const paymentResult = {}

      axios.put.mockResolvedValue({ data: { isPaid: true } })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      expect(axios.put).toHaveBeenCalledWith(
        '/api/orders/777/pay',
        {},
        expect.any(Object)
      )
    })

    it('accepts null paymentResult', async () => {
      const orderId = '888'

      axios.put.mockResolvedValue({ data: { isPaid: true } })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(orderId, null))

      expect(axios.put).toHaveBeenCalledWith(
        '/api/orders/888/pay',
        null,
        expect.any(Object)
      )
    })

    it('accepts malformed paymentResult and passes it through', async () => {
      const orderId = '999'
      const malformedPaymentResult = { invalid: 'data', nested: { foo: 'bar' } }

      axios.put.mockResolvedValue({ data: { isPaid: true } })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(orderId, malformedPaymentResult))

      expect(axios.put).toHaveBeenCalledWith(
        '/api/orders/999/pay',
        malformedPaymentResult,
        expect.any(Object)
      )
    })
  })

  describe('token in Authorization header', () => {
    it('correctly formats Authorization header with token', async () => {
      const orderId = 'order-1'
      const paymentResult = {}
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'

      axios.put.mockResolvedValue({ data: {} })

      const store = mockStore({
        userLogin: {
          userInfo: { token },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      const callConfig = axios.put.mock.calls[0][2]
      expect(callConfig.headers.Authorization).toBe(`Bearer ${token}`)
    })

    it('sends Authorization: Bearer undefined when token is missing from userInfo', async () => {
      const orderId = 'order-2'
      const paymentResult = {}

      axios.put.mockResolvedValue({ data: {} })

      const store = mockStore({
        userLogin: {
          userInfo: { _id: 'user1', name: 'John' },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      const callConfig = axios.put.mock.calls[0][2]
      expect(callConfig.headers.Authorization).toBe('Bearer undefined')
    })
  })

  describe('response handling', () => {
    it('includes entire response data in SUCCESS payload', async () => {
      const orderId = 'order-3'
      const paymentResult = {}
      const responseData = {
        _id: 'order-3',
        user: 'user-1',
        orderItems: [],
        isPaid: true,
        paidAt: '2026-04-25T12:00:00Z',
        itemsPrice: 100,
        taxPrice: 10,
        shippingPrice: 5,
        totalPrice: 115,
      }

      axios.put.mockResolvedValue({ data: responseData })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      const successAction = store.getActions()[1]
      expect(successAction.payload).toEqual(responseData)
    })

    it('dispatches SUCCESS even with empty response data', async () => {
      const orderId = 'order-4'
      const paymentResult = {}

      axios.put.mockResolvedValue({ data: {} })

      const store = mockStore({
        userLogin: {
          userInfo: { token: 'token123' },
        },
      })

      await store.dispatch(payOrder(orderId, paymentResult))

      const successAction = store.getActions()[1]
      expect(successAction).toEqual({
        type: ORDER_PAY_SUCCESS,
        payload: {},
      })
    })
  })
})
