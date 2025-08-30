// Global setup for all tests
export default async function globalSetup() {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // You could add database setup here if needed
  console.log('Global test setup completed');
}
