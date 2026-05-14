import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CheckoutSteps from '../components/CheckoutSteps'
import { savePaymentMethod } from '../actions/cartActions'
import './screens.css'

/*
  ASCII wireframe (ANTI_SLOP):
  [Step 1: Sign In ✓] [Step 2: Shipping ✓] [Step 3: Payment ●] [Step 4: Place Order]
  ─────────────────────────────────────── 48px gap
  ┌──────────────── max-width 480px, centered ─────────────────┐
  │  h1: Payment Method                                         │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │  fieldset                                           │   │
  │  │  legend: Select a payment method                    │   │
  │  │  ┌─────────────────────────────────────────────┐   │   │
  │  │  │ ● PayPal or Credit Card                     │   │   │
  │  │  └─────────────────────────────────────────────┘   │   │
  │  │  [Continue ─────────────────────────────────────]   │   │
  │  └─────────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────────┘

  User journey: buyer with shipping set → choose payment → Place Order
  Primary CTA: Continue button
*/

const PaymentScreen = ({ history }) => {
  const cart = useSelector((state) => state.cart)
  const { shippingAddress } = cart

  if (!shippingAddress.address) {
    history.push('/shipping')
  }

  const [paymentMethod, setPaymentMethod] = useState('PayPal')

  const dispatch = useDispatch()

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(savePaymentMethod(paymentMethod))
    history.push('/placeorder')
  }

  return (
    <>
      <CheckoutSteps step1 step2 step3 />

      <div className='ps-checkout-page'>
        <h1 className='ps-form-title'>Payment Method</h1>

        <form onSubmit={submitHandler} noValidate>
          <fieldset className='ps-fieldset'>
            <legend>Select a payment method</legend>

            <label className={`ps-radio-option${paymentMethod === 'PayPal' ? ' ps-radio-option--selected' : ''}`}>
              <input
                type='radio'
                name='paymentMethod'
                value='PayPal'
                checked={paymentMethod === 'PayPal'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              PayPal or Credit Card
            </label>

            {/* Stripe option — currently disabled in original code
            <label className={`ps-radio-option${paymentMethod === 'Stripe' ? ' ps-radio-option--selected' : ''}`}>
              <input
                type='radio'
                name='paymentMethod'
                value='Stripe'
                checked={paymentMethod === 'Stripe'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Stripe
            </label>
            */}
          </fieldset>

          <button type='submit' className='ps-btn ps-btn--primary'>
            Continue
          </button>
        </form>
      </div>
    </>
  )
}

export default PaymentScreen
