import axios from 'axios'
import {
  ORDER_PAY_REQUEST,
  ORDER_PAY_SUCCESS,
  ORDER_PAY_FAIL,
} from '../../frontend/src/constants/orderConstants'
import { logout } from '../../frontend/src/actions/userActions'

const extractErrorMessage = (error) => {
  return error.response && error.response.data.message
    ? error.response.data.message
    : error.message
}

const buildPaymentConfig = (token) => ({
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
})

const getUserToken = (getState) => {
  const {
    userLogin: { userInfo },
  } = getState()
  return userInfo.token
}

const handlePaymentError = (error, dispatch) => {
  const message = extractErrorMessage(error)

  if (message === 'Not authorized, token failed') {
    dispatch(logout())
  }

  dispatch({
    type: ORDER_PAY_FAIL,
    payload: message,
  })
}

export const payOrder = (orderId, paymentResult) => async (
  dispatch,
  getState
) => {
  dispatch({
    type: ORDER_PAY_REQUEST,
  })

  try {
    const token = getUserToken(getState)
    const config = buildPaymentConfig(token)
    const { data } = await axios.put(
      `/api/orders/${orderId}/pay`,
      paymentResult,
      config
    )

    dispatch({
      type: ORDER_PAY_SUCCESS,
      payload: data,
    })
  } catch (error) {
    handlePaymentError(error, dispatch)
  }
}
