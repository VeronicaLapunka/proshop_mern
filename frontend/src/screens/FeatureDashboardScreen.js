import React, { useEffect } from 'react'
import { Table } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { listFeatureFlags } from '../actions/featureFlagActions'

const FeatureDashboardScreen = ({ history }) => {
  const dispatch = useDispatch()

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const featureFlagList = useSelector((state) => state.featureFlagList)
  const { loading, error, features } = featureFlagList

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listFeatureFlags())
    } else {
      history.push('/login')
    }
  }, [dispatch, history, userInfo])

  return (
    <>
      <h1>Feature Flags Dashboard</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <Table striped bordered hover responsive className='table-sm'>
          <thead>
            <tr>
              <th>NAME</th>
              <th>STATUS</th>
              <th>TRAFFIC %</th>
              <th>LAST MODIFIED</th>
              <th>DEPENDS ON</th>
              <th>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.feature_id}>
                <td>
                  <strong>{feature.name}</strong>
                  <br />
                  <small style={{ color: '#888' }}>{feature.feature_id}</small>
                </td>
                <td>{feature.status}</td>
                <td>{feature.traffic_percentage}%</td>
                <td>{feature.last_modified}</td>
                <td>
                  {feature.dependencies && feature.dependencies.length > 0
                    ? feature.dependencies.join(', ')
                    : '—'}
                </td>
                <td style={{ maxWidth: '300px', fontSize: '0.85em' }}>
                  {feature.description || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}

export default FeatureDashboardScreen
