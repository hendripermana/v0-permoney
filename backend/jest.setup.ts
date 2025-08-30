import { Test } from "@nestjs/testing"
import { ConfigModule } from "@nestjs/config"
import { beforeAll, afterAll } from "@jest/globals"

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = "test"

  // Configure test database
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/permoney_test"

  // Configure test Redis
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || "redis://localhost:6379/1"
})

// Global test teardown
afterAll(async () => {
  // Cleanup test data
  await cleanupTestData()
})

// Helper function to create test module
export async function createTestModule(imports: any[] = [], providers: any[] = []) {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ".env.test",
      }),
      ...imports,
    ],
    providers,
  }).compile()
}

// Cleanup function
async function cleanupTestData() {
  // Add cleanup logic here
  console.log("Cleaning up test data...")
}
