/**
 * server.test.ts
 *
 * Comprehensive test suite for mcp-feature-flags/src/server.ts
 * Tests the MCP server and all 4 tools:
 * - list_features(): Returns all feature flags
 * - get_feature_info(feature_id): Returns full details of a single flag
 * - set_feature_state(feature_id, state): Changes flag status
 * - adjust_traffic_rollout(feature_id, percentage): Changes traffic % for Testing flags
 */

import {
  listFeatures,
  getFeatureInfo,
  setFeatureState,
  adjustTrafficRollout,
  readFeatures,
  writeFeatures,
  FEATURES_PATH,
  FeaturesFile,
} from '../src/helpers.ts'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Test fixtures
const mockFeaturesFile: FeaturesFile = {
  search_v2: {
    name: 'New Search Algorithm',
    description: 'Advanced search with BM25 ranking',
    status: 'Testing',
    traffic_percentage: 50,
    last_modified: '2026-05-25',
    targeted_segments: ['beta_users'],
    rollout_strategy: 'canary',
  },
  semantic_search: {
    name: 'Semantic Vector Search',
    description: 'Embedding-based semantic similarity',
    status: 'Testing',
    traffic_percentage: 25,
    last_modified: '2026-05-20',
    dependencies: ['search_v2'],
  },
  dark_mode: {
    name: 'Dark Mode',
    description: 'Dark theme for the UI',
    status: 'Disabled',
    traffic_percentage: 0,
    last_modified: '2026-05-22',
  },
  cart_redesign: {
    name: 'Redesigned Cart UI',
    description: 'New cart interface',
    status: 'Enabled',
    traffic_percentage: 100,
    last_modified: '2026-05-15',
  },
  gift_message: {
    name: 'Gift Message Feature',
    description: 'Add gift messages to orders',
    status: 'Testing',
    traffic_percentage: 40,
    last_modified: '2026-05-18',
  },
}

// Helper to create a temporary features.json for testing
function createTestFeatureFile(features: FeaturesFile): string {
  const tmpDir = path.dirname(FEATURES_PATH)
  const tmpFile = path.join(tmpDir, `.test-features-${Date.now()}.json`)
  fs.writeFileSync(tmpFile, JSON.stringify(features, null, 2) + '\n', 'utf-8')
  return tmpFile
}

describe('listFeatures', () => {
  let originalEnv: string | undefined
  let testFeaturesFile: string

  beforeEach(() => {
    originalEnv = process.env.FEATURES_JSON_PATH
    testFeaturesFile = createTestFeatureFile(mockFeaturesFile)
    process.env.FEATURES_JSON_PATH = testFeaturesFile
  })

  afterEach(() => {
    process.env.FEATURES_JSON_PATH = originalEnv
    try {
      fs.unlinkSync(testFeaturesFile)
    } catch {
      // ignore cleanup errors
    }
  })

  describe('happy path', () => {
    it('returns all features with correct structure', () => {
      const result = listFeatures()

      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('features')
      expect(Array.isArray(result.features)).toBe(true)
    })

    it('returns correct number of features', () => {
      const result = listFeatures()

      expect(result.total).toBe(5)
      expect(result.features).toHaveLength(5)
    })

    it('includes all expected feature_ids', () => {
      const result = listFeatures()
      const featureIds = result.features.map((f: any) => f.feature_id)

      expect(featureIds).toContain('search_v2')
      expect(featureIds).toContain('semantic_search')
      expect(featureIds).toContain('dark_mode')
      expect(featureIds).toContain('cart_redesign')
      expect(featureIds).toContain('gift_message')
    })

    it('includes required fields in each feature', () => {
      const result = listFeatures()

      result.features.forEach((feature: any) => {
        expect(feature).toHaveProperty('feature_id')
        expect(feature).toHaveProperty('name')
        expect(feature).toHaveProperty('status')
        expect(feature).toHaveProperty('traffic_percentage')
        expect(feature).toHaveProperty('last_modified')
        expect(feature).toHaveProperty('dependencies')
      })
    })

    it('returns correct status values', () => {
      const result = listFeatures()
      const statuses = result.features.map((f: any) => f.status)

      expect(statuses).toContain('Testing')
      expect(statuses).toContain('Disabled')
      expect(statuses).toContain('Enabled')
    })

    it('returns correct traffic percentages', () => {
      const result = listFeatures()
      const search = result.features.find((f: any) => f.feature_id === 'search_v2')
      const disabled = result.features.find((f: any) => f.feature_id === 'dark_mode')
      const enabled = result.features.find((f: any) => f.feature_id === 'cart_redesign')

      expect(search.traffic_percentage).toBe(50)
      expect(disabled.traffic_percentage).toBe(0)
      expect(enabled.traffic_percentage).toBe(100)
    })

    it('returns empty dependencies array when feature has no dependencies', () => {
      const result = listFeatures()
      const darkMode = result.features.find((f: any) => f.feature_id === 'dark_mode')

      expect(darkMode.dependencies).toEqual([])
    })

    it('returns correct dependencies when they exist', () => {
      const result = listFeatures()
      const semanticSearch = result.features.find((f: any) => f.feature_id === 'semantic_search')

      expect(semanticSearch.dependencies).toEqual(['search_v2'])
    })
  })

  describe('edge cases', () => {
    it('handles empty features file', () => {
      testFeaturesFile = createTestFeatureFile({})
      process.env.FEATURES_JSON_PATH = testFeaturesFile

      const result = listFeatures()

      expect(result.total).toBe(0)
      expect(result.features).toHaveLength(0)
    })

    it('handles single feature in file', () => {
      testFeaturesFile = createTestFeatureFile({
        single_feature: {
          name: 'Single',
          status: 'Enabled',
          traffic_percentage: 100,
          last_modified: '2026-05-25',
        },
      })
      process.env.FEATURES_JSON_PATH = testFeaturesFile

      const result = listFeatures()

      expect(result.total).toBe(1)
      expect(result.features[0].feature_id).toBe('single_feature')
    })
  })

  describe('error cases', () => {
    it('returns error object when features.json is missing', () => {
      process.env.FEATURES_JSON_PATH = '/nonexistent/features.json'

      const result = listFeatures()

      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('message')
      expect(result.error).toContain('ERROR')
    })

    it('returns error object when features.json is malformed JSON', () => {
      testFeaturesFile = path.join(path.dirname(FEATURES_PATH), `.bad-features-${Date.now()}.json`)
      fs.writeFileSync(testFeaturesFile, '{ invalid json', 'utf-8')
      process.env.FEATURES_JSON_PATH = testFeaturesFile

      const result = listFeatures()

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('JSON_PARSE_ERROR')
    })
  })
})

describe('getFeatureInfo', () => {
  let originalEnv: string | undefined
  let testFeaturesFile: string

  beforeEach(() => {
    originalEnv = process.env.FEATURES_JSON_PATH
    testFeaturesFile = createTestFeatureFile(mockFeaturesFile)
    process.env.FEATURES_JSON_PATH = testFeaturesFile
  })

  afterEach(() => {
    process.env.FEATURES_JSON_PATH = originalEnv
    try {
      fs.unlinkSync(testFeaturesFile)
    } catch {
      // ignore
    }
  })

  describe('happy path', () => {
    it('returns full info for existing feature', () => {
      const result = getFeatureInfo('search_v2')

      expect(result).toHaveProperty('feature_id')
      expect(result.feature_id).toBe('search_v2')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('description')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('traffic_percentage')
      expect(result).toHaveProperty('last_modified')
      expect(result).toHaveProperty('dependency_states')
    })

    it('includes all feature fields in response', () => {
      const result = getFeatureInfo('search_v2')

      expect(result.name).toBe('New Search Algorithm')
      expect(result.description).toBe('Advanced search with BM25 ranking')
      expect(result.status).toBe('Testing')
      expect(result.traffic_percentage).toBe(50)
    })

    it('includes dependency_states map', () => {
      const result = getFeatureInfo('semantic_search')

      expect(result).toHaveProperty('dependency_states')
      expect(typeof result.dependency_states).toBe('object')
    })

    it('returns correct dependency states', () => {
      const result = getFeatureInfo('semantic_search')

      expect(result.dependency_states.search_v2).toBe('Testing')
    })

    it('returns empty dependency_states for feature without dependencies', () => {
      const result = getFeatureInfo('dark_mode')

      expect(result.dependency_states).toEqual({})
    })

    it('handles feature with missing targeted_segments', () => {
      const result = getFeatureInfo('dark_mode')

      expect(result.feature_id).toBe('dark_mode')
      // targeted_segments may be undefined
    })
  })

  describe('edge cases - nonexistent features', () => {
    it('returns error for nonexistent feature_id', () => {
      const result = getFeatureInfo('nonexistent_feature')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('FEATURE_NOT_FOUND')
      expect(result).toHaveProperty('feature_id')
      expect(result.feature_id).toBe('nonexistent_feature')
    })

    it('is case-sensitive for feature_id', () => {
      const result = getFeatureInfo('Search_v2')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('FEATURE_NOT_FOUND')
    })

    it('is case-sensitive and does not match on typo', () => {
      const result = getFeatureInfo('search_v3')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('FEATURE_NOT_FOUND')
    })
  })

  describe('dependency resolution', () => {
    it('shows dependency status correctly', () => {
      const result = getFeatureInfo('semantic_search')

      expect(result.dependency_states['search_v2']).toBe('Testing')
    })

    it('handles missing dependencies gracefully', () => {
      // Add a feature with a dependency that doesn't exist
      const features = { ...mockFeaturesFile }
      features['feature_with_missing_dep'] = {
        name: 'Feature',
        status: 'Testing',
        traffic_percentage: 50,
        last_modified: '2026-05-25',
        dependencies: ['nonexistent_dep', 'search_v2'],
      }
      testFeaturesFile = createTestFeatureFile(features)
      process.env.FEATURES_JSON_PATH = testFeaturesFile

      const result = getFeatureInfo('feature_with_missing_dep')

      expect(result.dependency_states['search_v2']).toBe('Testing')
      // nonexistent_dep won't be in dependency_states
      expect(result.dependency_states['nonexistent_dep']).toBeUndefined()
    })
  })

  describe('error cases', () => {
    it('returns error when features.json cannot be read', () => {
      process.env.FEATURES_JSON_PATH = '/nonexistent/path/features.json'

      const result = getFeatureInfo('search_v2')

      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('message')
    })
  })
})

describe('setFeatureState', () => {
  let originalEnv: string | undefined
  let testFeaturesFile: string

  beforeEach(() => {
    originalEnv = process.env.FEATURES_JSON_PATH
    testFeaturesFile = createTestFeatureFile({ ...mockFeaturesFile })
    process.env.FEATURES_JSON_PATH = testFeaturesFile
  })

  afterEach(() => {
    process.env.FEATURES_JSON_PATH = originalEnv
    try {
      fs.unlinkSync(testFeaturesFile)
    } catch {
      // ignore
    }
  })

  describe('happy path - valid state transitions', () => {
    it('transitions from Testing to Disabled', () => {
      const result = setFeatureState('search_v2', 'Disabled')

      expect(result).toHaveProperty('error') ? expect(result.error).toBeUndefined() : null
      expect(result.status).toBe('Disabled')
      expect(result.traffic_percentage).toBe(0)
    })

    it('transitions from Testing to Enabled without blocked dependencies', () => {
      const result = setFeatureState('gift_message', 'Enabled')

      expect(result.status).toBe('Enabled')
      expect(result.traffic_percentage).toBe(100)
    })

    it('transitions from Disabled to Testing', () => {
      const result = setFeatureState('dark_mode', 'Testing')

      expect(result.status).toBe('Testing')
      expect(result.traffic_percentage).toBe(10) // Default for Testing
    })

    it('sets Disabled status to traffic 0', () => {
      const result = setFeatureState('search_v2', 'Disabled')

      expect(result.traffic_percentage).toBe(0)
    })

    it('sets Enabled status to traffic 100', () => {
      const result = setFeatureState('dark_mode', 'Enabled')

      expect(result.traffic_percentage).toBe(100)
    })

    it('preserves traffic_percentage when changing to Testing if already 1-99', () => {
      const result = setFeatureState('search_v2', 'Testing')

      expect(result.status).toBe('Testing')
      expect(result.traffic_percentage).toBe(50) // Preserved from 50%
    })

    it('updates last_modified on state change', () => {
      const result = setFeatureState('search_v2', 'Disabled')

      expect(result).toHaveProperty('last_modified')
      expect(result.last_modified).toMatch(/\d{4}-\d{2}-\d{2}/)
    })

    it('returns feature info in response', () => {
      const result = setFeatureState('search_v2', 'Disabled')

      expect(result).toHaveProperty('feature_id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('traffic_percentage')
      expect(result).toHaveProperty('last_modified')
    })
  })

  describe('invalid state validation', () => {
    it('rejects invalid state "disabled" (lowercase)', () => {
      const result = setFeatureState('search_v2', 'disabled')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('INVALID_STATE')
    })

    it('rejects invalid state "ENABLED" (uppercase)', () => {
      const result = setFeatureState('search_v2', 'ENABLED')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('INVALID_STATE')
    })

    it('rejects completely invalid state', () => {
      const result = setFeatureState('search_v2', 'Active')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('INVALID_STATE')
    })

    it('rejects empty state string', () => {
      const result = setFeatureState('search_v2', '')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('INVALID_STATE')
    })

    it('rejects null state', () => {
      const result = setFeatureState('search_v2', null as any)

      expect(result).toHaveProperty('error')
    })
  })

  describe('dependency blocking', () => {
    it('blocks Enabled transition when dependency is Disabled', () => {
      const result = setFeatureState('semantic_search', 'Enabled')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('DEPENDENCY_NOT_ENABLED')
    })

    it('includes dependency name in error message', () => {
      const result = setFeatureState('semantic_search', 'Enabled')

      expect(result.message).toContain('search_v2')
    })

    it('allows Enabled transition when dependency is already Enabled', () => {
      // First enable search_v2
      setFeatureState('search_v2', 'Enabled')
      // Then try to enable semantic_search
      const result = setFeatureState('semantic_search', 'Enabled')

      expect(result.status).toBe('Enabled')
    })
  })

  describe('dependency warnings', () => {
    it('warns when enabling with Testing dependencies', () => {
      // search_v2 is in Testing status
      const result = setFeatureState('semantic_search', 'Enabled')

      // This should be blocked, not just warned
      expect(result).toHaveProperty('error')
    })

    it('warns when Testing with unmet dependencies', () => {
      const result = setFeatureState('semantic_search', 'Testing')

      expect(result).toHaveProperty('warnings')
      expect(Array.isArray(result.warnings)).toBe(true)
    })
  })

  describe('nonexistent features', () => {
    it('returns error for nonexistent feature', () => {
      const result = setFeatureState('nonexistent', 'Enabled')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('FEATURE_NOT_FOUND')
    })

    it('includes feature_id in error response', () => {
      const result = setFeatureState('nonexistent', 'Enabled')

      expect(result).toHaveProperty('feature_id')
      expect(result.feature_id).toBe('nonexistent')
    })
  })

  describe('persistence', () => {
    it('persists state change to features.json', () => {
      setFeatureState('search_v2', 'Disabled')

      // Read the file directly to verify persistence
      const content = fs.readFileSync(testFeaturesFile, 'utf-8')
      const features = JSON.parse(content)

      expect(features.search_v2.status).toBe('Disabled')
      expect(features.search_v2.traffic_percentage).toBe(0)
    })

    it('persists multiple consecutive changes', () => {
      setFeatureState('search_v2', 'Enabled')
      setFeatureState('search_v2', 'Testing')
      const result = setFeatureState('search_v2', 'Disabled')

      expect(result.status).toBe('Disabled')

      const content = fs.readFileSync(testFeaturesFile, 'utf-8')
      const features = JSON.parse(content)

      expect(features.search_v2.status).toBe('Disabled')
    })
  })

  describe('Testing state traffic handling', () => {
    it('resets traffic to 10 when transitioning to Testing with 0%', () => {
      setFeatureState('search_v2', 'Disabled')
      const result = setFeatureState('search_v2', 'Testing')

      expect(result.traffic_percentage).toBe(10)
    })

    it('preserves traffic when transitioning to Testing with valid percentage', () => {
      // search_v2 starts at 50%
      const result = setFeatureState('search_v2', 'Testing')

      expect(result.traffic_percentage).toBe(50)
    })
  })
})

describe('adjustTrafficRollout', () => {
  let originalEnv: string | undefined
  let testFeaturesFile: string

  beforeEach(() => {
    originalEnv = process.env.FEATURES_JSON_PATH
    testFeaturesFile = createTestFeatureFile({ ...mockFeaturesFile })
    process.env.FEATURES_JSON_PATH = testFeaturesFile
  })

  afterEach(() => {
    process.env.FEATURES_JSON_PATH = originalEnv
    try {
      fs.unlinkSync(testFeaturesFile)
    } catch {
      // ignore
    }
  })

  describe('happy path - valid rollout adjustments', () => {
    it('increases traffic percentage', () => {
      const result = adjustTrafficRollout('search_v2', 75)

      expect(result.traffic_percentage).toBe(75)
      expect(result.status).toBe('Testing')
    })

    it('decreases traffic percentage', () => {
      const result = adjustTrafficRollout('search_v2', 20)

      expect(result.traffic_percentage).toBe(20)
    })

    it('sets traffic to 0', () => {
      const result = adjustTrafficRollout('search_v2', 0)

      expect(result.traffic_percentage).toBe(0)
    })

    it('sets traffic to 100', () => {
      const result = adjustTrafficRollout('search_v2', 100)

      expect(result.traffic_percentage).toBe(100)
    })

    it('handles canary ladder steps correctly', () => {
      const step1 = adjustTrafficRollout('gift_message', 5)
      expect(step1.traffic_percentage).toBe(5)

      const step2 = adjustTrafficRollout('gift_message', 25)
      expect(step2.traffic_percentage).toBe(25)

      const step3 = adjustTrafficRollout('gift_message', 50)
      expect(step3.traffic_percentage).toBe(50)

      const step4 = adjustTrafficRollout('gift_message', 100)
      expect(step4.traffic_percentage).toBe(100)
    })

    it('updates last_modified timestamp', () => {
      const result = adjustTrafficRollout('search_v2', 75)

      expect(result).toHaveProperty('last_modified')
      expect(result.last_modified).toMatch(/\d{4}-\d{2}-\d{2}/)
    })

    it('returns feature info in response', () => {
      const result = adjustTrafficRollout('search_v2', 75)

      expect(result).toHaveProperty('feature_id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('traffic_percentage')
    })

    it('preserves status as Testing', () => {
      const result = adjustTrafficRollout('search_v2', 75)

      expect(result.status).toBe('Testing')
    })
  })

  describe('invalid percentage values', () => {
    it('rejects percentage > 100', () => {
      const result = adjustTrafficRollout('search_v2', 101)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('INVALID_PERCENTAGE')
    })

    it('rejects percentage < 0', () => {
      const result = adjustTrafficRollout('search_v2', -1)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('INVALID_PERCENTAGE')
    })

    it('rejects decimal percentage 33.3', () => {
      const result = adjustTrafficRollout('search_v2', 33.3)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('INVALID_PERCENTAGE')
    })

    it('rejects floating point 50.5', () => {
      const result = adjustTrafficRollout('search_v2', 50.5)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('INVALID_PERCENTAGE')
    })

    it('accepts whole number percentage 50', () => {
      const result = adjustTrafficRollout('search_v2', 50)

      expect(result.traffic_percentage).toBe(50)
      expect(result).not.toHaveProperty('error')
    })
  })

  describe('wrong status for rollout', () => {
    it('rejects adjustment on Enabled feature', () => {
      const result = adjustTrafficRollout('cart_redesign', 50)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('WRONG_STATUS_FOR_ROLLOUT')
    })

    it('rejects adjustment on Disabled feature', () => {
      const result = adjustTrafficRollout('dark_mode', 50)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('WRONG_STATUS_FOR_ROLLOUT')
    })

    it('includes current status in error message', () => {
      const result = adjustTrafficRollout('cart_redesign', 50)

      expect(result.message).toContain('Enabled')
    })

    it('suggests set_feature_state in error message', () => {
      const result = adjustTrafficRollout('cart_redesign', 50)

      expect(result.message).toContain('set_feature_state')
    })
  })

  describe('nonexistent features', () => {
    it('returns error for nonexistent feature', () => {
      const result = adjustTrafficRollout('nonexistent', 50)

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('FEATURE_NOT_FOUND')
    })

    it('includes feature_id in error response', () => {
      const result = adjustTrafficRollout('nonexistent', 50)

      expect(result).toHaveProperty('feature_id')
      expect(result.feature_id).toBe('nonexistent')
    })
  })

  describe('hints for promotion', () => {
    it('provides hint when traffic reaches 0%', () => {
      const result = adjustTrafficRollout('search_v2', 0)

      expect(result).toHaveProperty('hint')
      expect(result.hint).toContain('Disabled')
      expect(result.hint).toContain('set_feature_state')
    })

    it('provides hint when traffic reaches 100%', () => {
      const result = adjustTrafficRollout('search_v2', 100)

      expect(result).toHaveProperty('hint')
      expect(result.hint).toContain('Enabled')
      expect(result.hint).toContain('set_feature_state')
    })

    it('returns null hint for intermediate percentages', () => {
      const result = adjustTrafficRollout('search_v2', 50)

      expect(result.hint).toBeNull()
    })
  })

  describe('persistence', () => {
    it('persists traffic change to features.json', () => {
      adjustTrafficRollout('search_v2', 75)

      const content = fs.readFileSync(testFeaturesFile, 'utf-8')
      const features = JSON.parse(content)

      expect(features.search_v2.traffic_percentage).toBe(75)
    })

    it('persists multiple rollout changes', () => {
      adjustTrafficRollout('search_v2', 10)
      adjustTrafficRollout('search_v2', 25)
      const result = adjustTrafficRollout('search_v2', 50)

      expect(result.traffic_percentage).toBe(50)

      const content = fs.readFileSync(testFeaturesFile, 'utf-8')
      const features = JSON.parse(content)

      expect(features.search_v2.traffic_percentage).toBe(50)
    })
  })

  describe('boundary values', () => {
    it('handles boundary 0%', () => {
      const result = adjustTrafficRollout('search_v2', 0)

      expect(result.traffic_percentage).toBe(0)
      expect(result.error).toBeUndefined()
    })

    it('handles boundary 100%', () => {
      const result = adjustTrafficRollout('search_v2', 100)

      expect(result.traffic_percentage).toBe(100)
      expect(result.error).toBeUndefined()
    })

    it('handles boundary 1%', () => {
      const result = adjustTrafficRollout('search_v2', 1)

      expect(result.traffic_percentage).toBe(1)
    })

    it('handles boundary 99%', () => {
      const result = adjustTrafficRollout('search_v2', 99)

      expect(result.traffic_percentage).toBe(99)
    })
  })

  describe('concurrent-like updates', () => {
    it('applies sequential traffic adjustments correctly', () => {
      adjustTrafficRollout('search_v2', 25)
      adjustTrafficRollout('search_v2', 50)
      const result = adjustTrafficRollout('search_v2', 75)

      expect(result.traffic_percentage).toBe(75)

      const content = fs.readFileSync(testFeaturesFile, 'utf-8')
      const features = JSON.parse(content)

      expect(features.search_v2.traffic_percentage).toBe(75)
    })
  })
})

describe('integration scenarios', () => {
  let originalEnv: string | undefined
  let testFeaturesFile: string

  beforeEach(() => {
    originalEnv = process.env.FEATURES_JSON_PATH
    testFeaturesFile = createTestFeatureFile({ ...mockFeaturesFile })
    process.env.FEATURES_JSON_PATH = testFeaturesFile
  })

  afterEach(() => {
    process.env.FEATURES_JSON_PATH = originalEnv
    try {
      fs.unlinkSync(testFeaturesFile)
    } catch {
      // ignore
    }
  })

  it('performs full canary ladder workflow', () => {
    // Start: transition to Testing
    let state = setFeatureState('dark_mode', 'Testing')
    expect(state.status).toBe('Testing')
    expect(state.traffic_percentage).toBe(10)

    // Canary ladder: 10% -> 25% -> 50% -> 100% -> Enabled
    let rollout = adjustTrafficRollout('dark_mode', 25)
    expect(rollout.traffic_percentage).toBe(25)

    rollout = adjustTrafficRollout('dark_mode', 50)
    expect(rollout.traffic_percentage).toBe(50)

    rollout = adjustTrafficRollout('dark_mode', 100)
    expect(rollout.traffic_percentage).toBe(100)
    expect(rollout.hint).toContain('Enabled')

    // Final: promote to Enabled
    state = setFeatureState('dark_mode', 'Enabled')
    expect(state.status).toBe('Enabled')
    expect(state.traffic_percentage).toBe(100)
  })

  it('performs kill-switch workflow', () => {
    // Feature is in Testing at 50%
    let info = getFeatureInfo('search_v2')
    expect(info.status).toBe('Testing')

    // Issue detected: disable immediately
    const disabled = setFeatureState('search_v2', 'Disabled')
    expect(disabled.status).toBe('Disabled')
    expect(disabled.traffic_percentage).toBe(0)

    // Verify state persists
    info = getFeatureInfo('search_v2')
    expect(info.status).toBe('Disabled')
  })

  it('lists all features and gets detailed info on each', () => {
    const list = listFeatures()
    expect(list.total).toBeGreaterThan(0)

    // Get info on each feature
    list.features.forEach((feature: any) => {
      const info = getFeatureInfo(feature.feature_id)

      expect(info).not.toHaveProperty('error')
      expect(info.status).toBe(feature.status)
    })
  })
})
