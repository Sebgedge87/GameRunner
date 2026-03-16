module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  testTimeout: 15000,
  // Pass --experimental-sqlite flag to Node workers
  testRunner: 'jest-circus/runner',
};
