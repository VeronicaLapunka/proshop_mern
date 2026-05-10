import axios from 'axios'
import {
  FEATURE_FLAGS_LIST_REQUEST,
  FEATURE_FLAGS_LIST_SUCCESS,
  FEATURE_FLAGS_LIST_FAIL,
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

    // Convert object map → array of { feature_id, ...fields }
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
