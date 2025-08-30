const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@permoney/shared$': '<rootDir>/shared/src/index.ts',
    '^@permoney/shared/(.*)$': '<rootDir>/shared/src/$1',
  },
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};
