import {
  FEATURE_FLAGS_LIST_REQUEST,
  FEATURE_FLAGS_LIST_SUCCESS,
  FEATURE_FLAGS_LIST_FAIL,
  FEATURE_FLAG_LIST_UPDATE_ITEM,
  FEATURE_FLAG_UPDATE_STATUS_REQUEST,
  FEATURE_FLAG_UPDATE_STATUS_SUCCESS,
  FEATURE_FLAG_UPDATE_STATUS_FAIL,
  FEATURE_FLAG_UPDATE_STATUS_RESET,
  FEATURE_FLAG_UPDATE_TRAFFIC_REQUEST,
  FEATURE_FLAG_UPDATE_TRAFFIC_SUCCESS,
  FEATURE_FLAG_UPDATE_TRAFFIC_FAIL,
  FEATURE_FLAG_UPDATE_TRAFFIC_RESET,
} from '../constants/featureFlagConstants'

export const featureFlagListReducer = (state = { features: [] }, action) => {
  switch (action.type) {
    case FEATURE_FLAGS_LIST_REQUEST:
      return { loading: true, features: [] }
    case FEATURE_FLAGS_LIST_SUCCESS:
      return { loading: false, features: action.payload }
    case FEATURE_FLAGS_LIST_FAIL:
      return { loading: false, error: action.payload }
    case FEATURE_FLAG_LIST_UPDATE_ITEM:
      return {
        ...state,
        features: state.features.map((f) =>
          f.feature_id === action.payload.feature_id
            ? { ...f, ...action.payload }
            : f
        ),
      }
    default:
      return state
  }
}

export const featureFlagUpdateStatusReducer = (state = {}, action) => {
  switch (action.type) {
    case FEATURE_FLAG_UPDATE_STATUS_REQUEST:
      return { loading: true }
    case FEATURE_FLAG_UPDATE_STATUS_SUCCESS:
      return { loading: false, success: true, feature: action.payload }
    case FEATURE_FLAG_UPDATE_STATUS_FAIL:
      return { loading: false, error: action.payload }
    case FEATURE_FLAG_UPDATE_STATUS_RESET:
      return {}
    default:
      return state
  }
}

export const featureFlagUpdateTrafficReducer = (state = {}, action) => {
  switch (action.type) {
    case FEATURE_FLAG_UPDATE_TRAFFIC_REQUEST:
      return { loading: true }
    case FEATURE_FLAG_UPDATE_TRAFFIC_SUCCESS:
      return { loading: false, success: true, feature: action.payload }
    case FEATURE_FLAG_UPDATE_TRAFFIC_FAIL:
      return { loading: false, error: action.payload }
    case FEATURE_FLAG_UPDATE_TRAFFIC_RESET:
      return {}
    default:
      return state
  }
}
