import "@testing-library/jest-dom"
import { configure } from "@testing-library/react"
import jest from "jest" // Import jest to fix the undeclared variable error

// Configure testing library
configure({ testIdAttribute: "data-testid" })

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
global.sessionStorage = localStorageMock

// Setup global test utilities
global.testUtils = {
  mockUser: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
  },
  mockHousehold: {
    id: "test-household-id",
    name: "Test Household",
  },
}
