const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  displayName: 'frontend',
  preset: '../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../coverage/frontend',
  testEnvironment: 'jsdom',
};

module.exports = createJestConfig(config);
