import axios from 'axios'
import {
  FEATURE_FLAGS_LIST_REQUEST,
  FEATURE_FLAGS_LIST_SUCCESS,
  FEATURE_FLAGS_LIST_FAIL,
  FEATURE_FLAG_LIST_UPDATE_ITEM,
  FEATURE_FLAG_UPDATE_STATUS_REQUEST,
  FEATURE_FLAG_UPDATE_STATUS_SUCCESS,
  FEATURE_FLAG_UPDATE_STATUS_FAIL,
  FEATURE_FLAG_UPDATE_TRAFFIC_REQUEST,
  FEATURE_FLAG_UPDATE_TRAFFIC_SUCCESS,
  FEATURE_FLAG_UPDATE_TRAFFIC_FAIL,
} from '../constants/featureFlagConstants'

export const listFeatureFlags = () => async (dispatch, getState) => {
  try {
    dispatch({ type: FEATURE_FLAGS_LIST_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.get('/api/feature-flags', config)

    const features = Object.entries(data).map(([feature_id, fields]) => ({
      feature_id,
      ...fields,
    }))

    dispatch({ type: FEATURE_FLAGS_LIST_SUCCESS, payload: features })
  } catch (error) {
    dispatch({
      type: FEATURE_FLAGS_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

export const updateFeatureFlagStatus =
  (name, status) => async (dispatch, getState) => {
    try {
      dispatch({ type: FEATURE_FLAG_UPDATE_STATUS_REQUEST })

      const {
        userLogin: { userInfo },
      } = getState()

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      }

      const { data } = await axios.patch(
        `/api/feature-flags/${name}/status`,
        { status },
        config
      )

      dispatch({ type: FEATURE_FLAG_UPDATE_STATUS_SUCCESS, payload: data })
      dispatch({ type: FEATURE_FLAG_LIST_UPDATE_ITEM, payload: data })
    } catch (error) {
      dispatch({
        type: FEATURE_FLAG_UPDATE_STATUS_FAIL,
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      })
    }
  }

export const updateFeatureFlagTraffic =
  (name, traffic_percentage) => async (dispatch, getState) => {
    try {
      dispatch({ type: FEATURE_FLAG_UPDATE_TRAFFIC_REQUEST })

      const {
        userLogin: { userInfo },
      } = getState()

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      }

      const { data } = await axios.patch(
        `/api/feature-flags/${name}/traffic`,
        { traffic_percentage },
        config
      )

      dispatch({ type: FEATURE_FLAG_UPDATE_TRAFFIC_SUCCESS, payload: data })
      dispatch({ type: FEATURE_FLAG_LIST_UPDATE_ITEM, payload: data })
    } catch (error) {
      dispatch({
        type: FEATURE_FLAG_UPDATE_TRAFFIC_FAIL,
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      })
    }
  }
