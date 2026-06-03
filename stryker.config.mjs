// @ts-check
/** @type {import('@stryker-mutator/api').StrykerOptions} */
const config = {
  _comment:
    'This config was generated using `stryker init`. Please take a look at: https://stryker-mutator.io/docs/stryker-js/configuration/ for more information',
  disableBail: true,
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  testRunnerNodeArgs: ['--experimental-vm-modules'],
  mutate: [
    'backend/services/exampleService.js',
  ],
};

export default config;
