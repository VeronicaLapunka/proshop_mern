import {
  FEATURE_FLAGS_LIST_REQUEST,
  FEATURE_FLAGS_LIST_SUCCESS,
  FEATURE_FLAGS_LIST_FAIL,
} from '../constants/featureFlagConstants'

export const featureFlagListReducer = (state = { features: [] }, action) => {
  switch (action.type) {
    case FEATURE_FLAGS_LIST_REQUEST:
      return { loading: true, features: [] }
    case FEATURE_FLAGS_LIST_SUCCESS:
      return { loading: false, features: action.payload }
    case FEATURE_FLAGS_LIST_FAIL:
      return { loading: false, error: action.payload }
    default:
      return state
  }
}
