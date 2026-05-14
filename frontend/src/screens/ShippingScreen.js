import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CheckoutSteps from '../components/CheckoutSteps'
import { saveShippingAddress } from '../actions/cartActions'
import './screens.css'

/*
  ASCII wireframe (ANTI_SLOP):
  [Step 1: Sign In ✓] [Step 2: Shipping ●] [Step 3: Payment] [Step 4: Place Order]
  ─────────────────────────────────────── 48px gap
  ┌──────────────── max-width 480px, centered ─────────────────┐
  │  h1: Shipping Address                                       │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │  fieldset                                           │   │
  │  │  legend: Delivery Details                           │   │
  │  │  [label: Address]  [input text]                     │   │
  │  │  [label: City]     [input text]                     │   │
  │  │  [label: Postal]   [input text]                     │   │
  │  │  [label: Country]  [input text]                     │   │
  │  │  [Continue ─────────────────────────────────────]   │   │
  │  └─────────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────────┘

  User journey: logged-in buyer → enter shipping details → Payment
  Primary CTA: Continue button
*/

const ShippingScreen = ({ history }) => {
  const cart = useSelector((state) => state.cart)
  const { shippingAddress } = cart

  const [address,    setAddress]    = useState(shippingAddress.address    || '')
  const [city,       setCity]       = useState(shippingAddress.city       || '')
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '')
  const [country,    setCountry]    = useState(shippingAddress.country    || '')

  const dispatch = useDispatch()

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(saveShippingAddress({ address, city, postalCode, country }))
    history.push('/payment')
  }

  return (
    <>
      <CheckoutSteps step1 step2 />

      <div className='ps-checkout-page'>
        <h1 className='ps-form-title'>Shipping Address</h1>

        <form onSubmit={submitHandler} noValidate>
          <fieldset className='ps-fieldset'>
            <legend>Delivery Details</legend>

            <div className='ps-form-group'>
              <label htmlFor='shipping-address' className='ps-label'>
                Address <span className='ps-required' aria-label='required'>*</span>
              </label>
              <input
                id='shipping-address'
                type='text'
                className='ps-input'
                placeholder='Street address'
                value={address}
                required
                aria-required='true'
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className='ps-form-group'>
              <label htmlFor='shipping-city' className='ps-label'>
                City <span className='ps-required' aria-label='required'>*</span>
              </label>
              <input
                id='shipping-city'
                type='text'
                className='ps-input'
                placeholder='City'
                value={city}
                required
                aria-required='true'
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className='ps-form-group'>
              <label htmlFor='shipping-postal' className='ps-label'>
                Postal Code <span className='ps-required' aria-label='required'>*</span>
              </label>
              <input
                id='shipping-postal'
                type='text'
                className='ps-input'
                placeholder='Postal code'
                value={postalCode}
                required
                aria-required='true'
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>

            <div className='ps-form-group'>
              <label htmlFor='shipping-country' className='ps-label'>
                Country <span className='ps-required' aria-label='required'>*</span>
              </label>
              <input
                id='shipping-country'
                type='text'
                className='ps-input'
                placeholder='Country'
                value={country}
                required
                aria-required='true'
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </fieldset>

          <button type='submit' className='ps-btn ps-btn--primary'>
            Continue
          </button>
        </form>
      </div>
    </>
  )
}

export default ShippingScreen
