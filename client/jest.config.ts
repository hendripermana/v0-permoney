import type { Config } from "jest"

const config: Config = {
  displayName: "client",
  preset: "../jest.preset.js",
  testEnvironment: "jsdom",

  // Test file patterns
  testMatch: ["<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)", "<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)"],

  // Module resolution
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/../packages/shared/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{ts,tsx,js,jsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/main.tsx",
    "!src/vite-env.d.ts",
  ],

  coverageDirectory: "../coverage/client",
  coverageReporters: ["text", "lcov", "html"],

  // Transform configuration
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // Test environment setup
  testEnvironmentOptions: {
    url: "http://localhost:3000",
  },

  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
}

export default config
