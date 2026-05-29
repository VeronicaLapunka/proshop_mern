module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          types: ['jest', 'node'],
        },
      },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s',
    '**/?(*.)+(spec|test).[jt]s',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'backend/**/*.js',
    'mcp-feature-flags/src/**/*.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '__tests__',
  ],
};
