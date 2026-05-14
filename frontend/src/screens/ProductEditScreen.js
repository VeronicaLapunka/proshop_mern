import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { listProductDetails, updateProduct } from '../actions/productActions'
import { PRODUCT_UPDATE_RESET } from '../constants/productConstants'
import './screens.css'

const ProductEditScreen = ({ match, history }) => {
  const productId = match.params.id

  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [image, setImage] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [countInStock, setCountInStock] = useState(0)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)

  const dispatch = useDispatch()

  const productDetails = useSelector((state) => state.productDetails)
  const { loading, error, product } = productDetails

  const productUpdate = useSelector((state) => state.productUpdate)
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = productUpdate

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: PRODUCT_UPDATE_RESET })
      history.push('/admin/productlist')
    } else {
      if (!product.name || product._id !== productId) {
        dispatch(listProductDetails(productId))
      } else {
        setName(product.name)
        setPrice(product.price)
        setImage(product.image)
        setBrand(product.brand)
        setCategory(product.category)
        setCountInStock(product.countInStock)
        setDescription(product.description)
      }
    }
  }, [dispatch, history, productId, product, successUpdate])

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('image', file)
    setUploading(true)

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }

      const { data } = await axios.post('/api/upload', formData, config)

      setImage(data)
      setUploading(false)
    } catch (error) {
      console.error(error)
      setUploading(false)
    }
  }

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(
      updateProduct({
        _id: productId,
        name,
        price,
        image,
        brand,
        category,
        description,
        countInStock,
      })
    )
  }

  return (
    <>
      <Link to='/admin/productlist' className='ps-back'>
        &#8592; Back to Products
      </Link>

      <div className='ps-checkout-page'>
        <h1 className='ps-form-title'>Edit Product</h1>

        {loadingUpdate && (
          <div className='ps-loader' role='status' aria-label='Saving'>
            <div className='ps-loader__ring' />
          </div>
        )}
        {errorUpdate && (
          <div className='ps-alert ps-alert--error' role='alert'>{errorUpdate}</div>
        )}

        {loading ? (
          <div className='ps-loader' role='status' aria-label='Loading'>
            <div className='ps-loader__ring' />
          </div>
        ) : error ? (
          <div className='ps-alert ps-alert--error' role='alert'>{error}</div>
        ) : (
          <form onSubmit={submitHandler}>
            <fieldset className='ps-fieldset'>
              <legend>Product Details</legend>

              <div className='ps-form-group'>
                <label className='ps-label' htmlFor='name'>
                  Name <span className='ps-required' aria-hidden='true'>*</span>
                </label>
                <input
                  id='name'
                  type='text'
                  className='ps-input'
                  placeholder='Enter name'
                  value={name}
                  required
                  aria-required='true'
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className='ps-form-group'>
                <label className='ps-label' htmlFor='price'>
                  Price <span className='ps-required' aria-hidden='true'>*</span>
                </label>
                <input
                  id='price'
                  type='number'
                  className='ps-input'
                  placeholder='Enter price'
                  value={price}
                  required
                  aria-required='true'
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className='ps-form-group'>
                <label className='ps-label' htmlFor='image'>
                  Image URL
                </label>
                <input
                  id='image'
                  type='text'
                  className='ps-input'
                  placeholder='Enter image url'
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
                <input
                  type='file'
                  className='ps-file-input'
                  aria-label='Upload image file'
                  onChange={uploadFileHandler}
                />
                {uploading && (
                  <div className='ps-loader' role='status' aria-label='Uploading'>
                    <div className='ps-loader__ring' />
                  </div>
                )}
              </div>

              <div className='ps-form-group'>
                <label className='ps-label' htmlFor='brand'>
                  Brand <span className='ps-required' aria-hidden='true'>*</span>
                </label>
                <input
                  id='brand'
                  type='text'
                  className='ps-input'
                  placeholder='Enter brand'
                  value={brand}
                  required
                  aria-required='true'
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className='ps-form-group'>
                <label className='ps-label' htmlFor='countInStock'>
                  Count In Stock
                </label>
                <input
                  id='countInStock'
                  type='number'
                  className='ps-input'
                  placeholder='Enter count in stock'
                  value={countInStock}
                  onChange={(e) => setCountInStock(e.target.value)}
                />
              </div>

              <div className='ps-form-group'>
                <label className='ps-label' htmlFor='category'>
                  Category <span className='ps-required' aria-hidden='true'>*</span>
                </label>
                <input
                  id='category'
                  type='text'
                  className='ps-input'
                  placeholder='Enter category'
                  value={category}
                  required
                  aria-required='true'
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className='ps-form-group'>
                <label className='ps-label' htmlFor='description'>
                  Description
                </label>
                <input
                  id='description'
                  type='text'
                  className='ps-input'
                  placeholder='Enter description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </fieldset>

            <div className='ps-form-submit'>
              <button type='submit' className='ps-btn ps-btn--primary'>
                Update
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}

export default ProductEditScreen
