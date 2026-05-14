import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Paginate from '../components/Paginate'
import {
  listProducts,
  deleteProduct,
  createProduct,
} from '../actions/productActions'
import { PRODUCT_CREATE_RESET } from '../constants/productConstants'
import './screens.css'

const IconPlus = () => (
  <svg width='14' height='14' viewBox='0 0 14 14' fill='none'
    stroke='currentColor' strokeWidth='2' strokeLinecap='round' aria-hidden='true'>
    <path d='M7 2v10M2 7h10' />
  </svg>
)

const IconEdit = () => (
  <svg width='14' height='14' viewBox='0 0 14 14' fill='none'
    stroke='currentColor' strokeWidth='2' strokeLinecap='round'
    strokeLinejoin='round' aria-hidden='true'>
    <path d='M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z' />
  </svg>
)

const IconTrash = () => (
  <svg width='14' height='14' viewBox='0 0 14 14' fill='none'
    stroke='currentColor' strokeWidth='2' strokeLinecap='round'
    strokeLinejoin='round' aria-hidden='true'>
    <path d='M2 4h10M5 4V2h4v2M5.5 4v7M8.5 4v7M3 4l1 8h6l1-8' />
  </svg>
)

const ProductListScreen = ({ history, match }) => {
  const pageNumber = match.params.pageNumber || 1

  const dispatch = useDispatch()

  const productList = useSelector((state) => state.productList)
  const { loading, error, products, page, pages } = productList

  const productDelete = useSelector((state) => state.productDelete)
  const {
    loading: loadingDelete,
    error: errorDelete,
    success: successDelete,
  } = productDelete

  const productCreate = useSelector((state) => state.productCreate)
  const {
    loading: loadingCreate,
    error: errorCreate,
    success: successCreate,
    product: createdProduct,
  } = productCreate

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    dispatch({ type: PRODUCT_CREATE_RESET })

    if (!userInfo || !userInfo.isAdmin) {
      history.push('/login')
    }

    if (successCreate) {
      history.push(`/admin/product/${createdProduct._id}/edit`)
    } else {
      dispatch(listProducts('', pageNumber))
    }
  }, [
    dispatch,
    history,
    userInfo,
    successDelete,
    successCreate,
    createdProduct,
    pageNumber,
  ])

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure')) {
      dispatch(deleteProduct(id))
    }
  }

  const createProductHandler = () => {
    dispatch(createProduct())
  }

  return (
    <>
      <div className='ps-admin-toolbar'>
        <h1 className='ps-admin-title'>Products</h1>
        <button className='ps-btn ps-btn--primary' style={{ width: 'auto' }} onClick={createProductHandler}>
          <IconPlus /> Create Product
        </button>
      </div>

      {loadingDelete && (
        <div className='ps-loader' role='status' aria-label='Deleting'>
          <div className='ps-loader__ring' />
        </div>
      )}
      {errorDelete && (
        <div className='ps-alert ps-alert--error' role='alert'>{errorDelete}</div>
      )}
      {loadingCreate && (
        <div className='ps-loader' role='status' aria-label='Creating'>
          <div className='ps-loader__ring' />
        </div>
      )}
      {errorCreate && (
        <div className='ps-alert ps-alert--error' role='alert'>{errorCreate}</div>
      )}

      {loading ? (
        <div className='ps-loader' role='status' aria-label='Loading'>
          <div className='ps-loader__ring' />
        </div>
      ) : error ? (
        <div className='ps-alert ps-alert--error' role='alert'>{error}</div>
      ) : (
        <>
          <div className='ps-table-wrap'>
            <table className='ps-table'>
              <thead>
                <tr>
                  <th scope='col'>ID</th>
                  <th scope='col'>NAME</th>
                  <th scope='col'>PRICE</th>
                  <th scope='col'>CATEGORY</th>
                  <th scope='col'>BRAND</th>
                  <th scope='col'><span className='ps-sr-only'>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product._id}</td>
                    <td>{product.name}</td>
                    <td>${product.price}</td>
                    <td>{product.category}</td>
                    <td>{product.brand}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Link
                        to={`/admin/product/${product._id}/edit`}
                        className='ps-btn ps-btn--ghost'
                        style={{ display: 'inline-flex', marginRight: 8 }}
                        aria-label={`Edit ${product.name}`}
                      >
                        <IconEdit />
                      </Link>
                      <button
                        className='ps-btn ps-btn--icon'
                        onClick={() => deleteHandler(product._id)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginate pages={pages} page={page} isAdmin={true} />
        </>
      )}
    </>
  )
}

export default ProductListScreen
