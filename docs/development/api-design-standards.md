# API Design Standards & GraphQL Conventions

## Overview

This document establishes comprehensive API design standards and GraphQL conventions for the
Permoney project, ensuring consistency, maintainability, and excellent developer experience across
all API endpoints.

## REST API Design Standards

### URL Structure & Naming

#### Resource Naming Conventions

\`\`\`
# Use nouns, not verbs
✅ GET /api/v1/transactions
❌ GET /api/v1/getTransactions

# Use plural nouns for collections
✅ GET /api/v1/accounts
❌ GET /api/v1/account

# Use kebab-case for multi-word resources
✅ GET /api/v1/exchange-rates
❌ GET /api/v1/exchangeRates
❌ GET /api/v1/exchange_rates

# Nested resources for relationships
✅ GET /api/v1/households/123/members
✅ GET /api/v1/accounts/456/transactions
❌ GET /api/v1/household-members?householdId=123
\`\`\`

#### URL Structure Patterns

\`\`\`
# Collection operations
GET    /api/v1/transactions           # List transactions
POST   /api/v1/transactions           # Create transaction
GET    /api/v1/transactions/search    # Search transactions

# Resource operations
GET    /api/v1/transactions/123       # Get specific transaction
PUT    /api/v1/transactions/123       # Update transaction (full)
PATCH  /api/v1/transactions/123       # Update transaction (partial)
DELETE /api/v1/transactions/123       # Delete transaction

# Sub-resource operations
GET    /api/v1/transactions/123/splits      # Get transaction splits
POST   /api/v1/transactions/123/splits      # Add split to transaction
DELETE /api/v1/transactions/123/splits/456  # Remove specific split

# Action-based endpoints (when CRUD isn't sufficient)
POST   /api/v1/transactions/123/categorize  # Categorize transaction
POST   /api/v1/budgets/123/reset            # Reset budget
POST   /api/v1/accounts/123/reconcile       # Reconcile account
\`\`\`

### HTTP Methods & Status Codes

#### HTTP Method Usage

\`\`\`typescript
// GET - Retrieve data (idempotent, safe)
GET / api / v1 / transactions;
GET / api / v1 / transactions / 123;

// POST - Create new resource or perform action
POST / api / v1 / transactions; // Create transaction
POST / api / v1 / auth / login; // Perform login action
POST / api / v1 / reports / generate; // Generate report

// PUT - Replace entire resource (idempotent)
PUT / api / v1 / transactions / 123; // Replace entire transaction

// PATCH - Partial update (idempotent)
PATCH / api / v1 / transactions / 123; // Update specific fields

// DELETE - Remove resource (idempotent)
DELETE / api / v1 / transactions / 123; // Delete transaction
\`\`\`

#### Status Code Standards

\`\`\`typescript
// Success responses
200 OK              // Successful GET, PUT, PATCH
201 Created         // Successful POST (resource created)
202 Accepted        // Async operation started
204 No Content      // Successful DELETE or PUT with no response body

// Client error responses
400 Bad Request     // Invalid request data
401 Unauthorized    // Authentication required
403 Forbidden       // Insufficient permissions
404 Not Found       // Resource doesn't exist
409 Conflict        // Resource conflict (duplicate, constraint violation)
422 Unprocessable Entity  // Validation errors
429 Too Many Requests     // Rate limit exceeded

// Server error responses
500 Internal Server Error  // Unexpected server error
502 Bad Gateway           // Upstream service error
503 Service Unavailable   // Temporary service unavailability
\`\`\`

### Request & Response Formats

#### Request Format Standards

\`\`\`typescript
// Content-Type headers
POST /api/v1/transactions
Content-Type: application/json
Accept: application/json

// Request body structure
{
  "amount": 50000,
  "currency": "IDR",
  "description": "Grocery shopping",
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "accountId": "550e8400-e29b-41d4-a716-446655440001",
  "date": "2024-01-15",
  "tags": ["grocery", "food"],
  "metadata": {
    "merchant": "Supermarket ABC",
    "location": "Jakarta"
  }
}

// Query parameters for filtering and pagination
GET /api/v1/transactions?
  householdId=123&
  categoryId=456&
  startDate=2024-01-01&
  endDate=2024-01-31&
  limit=20&
  offset=0&
  sortBy=date&
  sortOrder=desc
\`\`\`

#### Response Format Standards

\`\`\`typescript
// Successful single resource response
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 50000,
    "currency": "IDR",
    "description": "Grocery shopping",
    "categoryId": "550e8400-e29b-41d4-a716-446655440001",
    "category": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Groceries",
      "color": "#4CAF50"
    },
    "date": "2024-01-15T00:00:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}

// Successful collection response with pagination
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 50000,
      "description": "Grocery shopping"
      // ... other fields
    }
  ],
  "pagination": {
    "total": 150,
    "count": 20,
    "limit": 20,
    "offset": 0,
    "hasNext": true,
    "hasPrevious": false,
    "nextOffset": 20,
    "previousOffset": null
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}

// Error response format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "details": [
      {
        "field": "amount",
        "code": "REQUIRED",
        "message": "Amount is required"
      },
      {
        "field": "categoryId",
        "code": "INVALID_UUID",
        "message": "Category ID must be a valid UUID"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
\`\`\`

### Filtering, Sorting & Pagination

#### Query Parameter Standards

\`\`\`typescript
// Filtering
GET /api/v1/transactions?
  // Exact match
  categoryId=123&
  currency=IDR&

  // Range queries
  startDate=2024-01-01&
  endDate=2024-01-31&
  minAmount=10000&
  maxAmount=100000&

  // Text search
  search=grocery&
  description=contains:shopping&

  // Array filters
  tags=food,grocery&
  accountIds=123,456,789&

  // Boolean filters
  isRecurring=true&
  hasReceipt=false

// Sorting
GET /api/v1/transactions?
  sortBy=date&           // Single field
  sortOrder=desc&        // asc or desc

  // Multiple fields
  sortBy=date,amount&
  sortOrder=desc,asc

// Pagination
GET /api/v1/transactions?
  limit=20&              // Items per page (max 100)
  offset=40&             // Skip items

  // Alternative cursor-based pagination
  cursor=eyJkYXRlIjoiMjAyNC0wMS0xNSJ9&
  limit=20

// Field selection (sparse fieldsets)
GET /api/v1/transactions?
  fields=id,amount,description,date&
  include=category,account
\`\`\`

#### Advanced Filtering Examples

\`\`\`typescript
// Complex filters using query operators
GET /api/v1/transactions?
  amount[gte]=10000&           // Greater than or equal
  amount[lt]=100000&           // Less than
  date[between]=2024-01-01,2024-01-31&  // Between dates
  description[contains]=grocery&        // Text contains
  tags[in]=food,shopping&              // Array contains any
  category.name[startsWith]=Food       // Nested field filter

// Logical operators
GET /api/v1/transactions?
  filter[and][0][amount][gte]=10000&
  filter[and][1][categoryId]=123&
  filter[or][0][tags][in]=urgent&
  filter[or][1][amount][gte]=1000000
\`\`\`

### Error Handling

#### Error Code Standards

\`\`\`typescript
// Client errors (4xx)
const CLIENT_ERRORS = {
  VALIDATION_ERROR: 'Request validation failed',
  AUTHENTICATION_REQUIRED: 'Authentication is required',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation',
  RESOURCE_NOT_FOUND: 'The requested resource was not found',
  RESOURCE_CONFLICT: 'Resource conflict or constraint violation',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  INVALID_REQUEST_FORMAT: 'Request format is invalid',
};

// Business logic errors (422)
const BUSINESS_ERRORS = {
  INSUFFICIENT_FUNDS: 'Account has insufficient funds',
  INVALID_CURRENCY_CONVERSION: 'Currency conversion failed',
  BUDGET_EXCEEDED: 'Transaction would exceed budget limit',
  DUPLICATE_TRANSACTION: 'Transaction already exists',
  INVALID_DATE_RANGE: 'Date range is invalid',
  ACCOUNT_INACTIVE: 'Account is inactive or closed',
};

// Server errors (5xx)
const SERVER_ERRORS = {
  INTERNAL_ERROR: 'An unexpected error occurred',
  DATABASE_ERROR: 'Database operation failed',
  EXTERNAL_SERVICE_ERROR: 'External service is unavailable',
  CONFIGURATION_ERROR: 'Server configuration error',
};
\`\`\`

#### Error Response Examples

\`\`\`typescript
// Validation error (422)
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "details": [
      {
        "field": "amount",
        "code": "POSITIVE_NUMBER_REQUIRED",
        "message": "Amount must be a positive number",
        "value": -100
      },
      {
        "field": "date",
        "code": "INVALID_DATE_FORMAT",
        "message": "Date must be in YYYY-MM-DD format",
        "value": "2024/01/15"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}

// Business logic error (422)
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Account has insufficient funds for this transaction",
    "details": {
      "accountId": "550e8400-e29b-41d4-a716-446655440000",
      "currentBalance": 25000,
      "requestedAmount": 50000,
      "currency": "IDR"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}

// Server error (500)
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred while processing your request",
    "details": {
      "errorId": "err_123456789",
      "supportContact": "support@permoney.com"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
\`\`\`

## GraphQL Design Standards

### Schema Design Principles

#### Type Naming Conventions

\`\`\`graphql
# Types: PascalCase
type Transaction {
  id: ID!
  amount: Money!
  description: String!
}

# Enums: PascalCase with SCREAMING_SNAKE_CASE values
enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
}

# Interfaces: PascalCase with descriptive names
interface Node {
  id: ID!
}

interface Timestamped {
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Input types: PascalCase with Input suffix
input CreateTransactionInput {
  amount: MoneyInput!
  description: String!
  categoryId: ID!
}

# Scalar types: PascalCase
scalar DateTime
scalar Money
scalar Currency
\`\`\`

#### Field Naming Conventions

\`\`\`graphql
type Transaction {
  # Use camelCase for field names
  id: ID!
  householdId: ID!
  accountId: ID!

  # Use descriptive names
  originalAmount: Money # Not: origAmt
  exchangeRate: Float # Not: exRate
  createdAt: DateTime # Not: created
  # Boolean fields with is/has prefix
  isRecurring: Boolean!
  hasReceipt: Boolean!

  # Collections use plural names
  tags: [String!]!
  splits: [TransactionSplit!]!

  # Relationships use singular/plural appropriately
  category: Category # One-to-one
  account: Account! # Many-to-one
  ledgerEntries: [LedgerEntry!]! # One-to-many
}
\`\`\`

### Query Design Patterns

#### Query Structure

\`\`\`graphql
type Query {
  # Single resource queries
  transaction(id: ID!): Transaction
  account(id: ID!): Account
  household(id: ID!): Household

  # Collection queries with filtering
  transactions(
    householdId: ID!
    filters: TransactionFilters
    pagination: PaginationInput
    sorting: SortingInput
  ): TransactionConnection!

  # Search queries
  searchTransactions(
    householdId: ID!
    query: String!
    filters: TransactionFilters
    pagination: PaginationInput
  ): TransactionSearchResult!

  # Aggregation queries
  transactionSummary(
    householdId: ID!
    period: DateRange!
    groupBy: TransactionGroupBy
  ): TransactionSummary!

  # Dashboard queries (optimized for UI)
  dashboard(householdId: ID!, viewType: ViewType!, period: DateRange): Dashboard!
}
\`\`\`

#### Filter Input Design

\`\`\`graphql
input TransactionFilters {
  # Exact match filters
  categoryId: ID
  accountId: ID
  currency: Currency

  # Range filters
  dateRange: DateRangeInput
  amountRange: MoneyRangeInput

  # Text filters
  descriptionContains: String
  merchantContains: String

  # Array filters
  categoryIds: [ID!]
  accountIds: [ID!]
  tags: [String!]

  # Boolean filters
  isRecurring: Boolean
  hasReceipt: Boolean

  # Nested filters
  category: CategoryFilters
  account: AccountFilters
}

input DateRangeInput {
  start: DateTime!
  end: DateTime!
}

input MoneyRangeInput {
  min: MoneyInput
  max: MoneyInput
  currency: Currency!
}

input PaginationInput {
  first: Int
  after: String
  last: Int
  before: String
}

input SortingInput {
  field: TransactionSortField!
  direction: SortDirection!
}

enum TransactionSortField {
  DATE
  AMOUNT
  DESCRIPTION
  CREATED_AT
  UPDATED_AT
}

enum SortDirection {
  ASC
  DESC
}
\`\`\`

#### Connection Pattern for Pagination

\`\`\`graphql
type TransactionConnection {
  edges: [TransactionEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type TransactionEdge {
  node: Transaction!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
\`\`\`

### Mutation Design Patterns

#### Mutation Structure

\`\`\`graphql
type Mutation {
  # Create operations
  createTransaction(input: CreateTransactionInput!): CreateTransactionPayload!
  createAccount(input: CreateAccountInput!): CreateAccountPayload!

  # Update operations
  updateTransaction(id: ID!, input: UpdateTransactionInput!): UpdateTransactionPayload!
  updateAccount(id: ID!, input: UpdateAccountInput!): UpdateAccountPayload!

  # Delete operations
  deleteTransaction(id: ID!): DeleteTransactionPayload!
  deleteAccount(id: ID!): DeleteAccountPayload!

  # Bulk operations
  createTransactions(input: [CreateTransactionInput!]!): CreateTransactionsPayload!
  updateTransactions(input: [UpdateTransactionInput!]!): UpdateTransactionsPayload!

  # Action-based mutations
  categorizeTransaction(id: ID!, categoryId: ID!): CategorizeTransactionPayload!
  splitTransaction(id: ID!, splits: [TransactionSplitInput!]!): SplitTransactionPayload!
  reconcileAccount(id: ID!, balance: MoneyInput!): ReconcileAccountPayload!
}
\`\`\`

#### Mutation Payload Pattern

\`\`\`graphql
# Standard payload structure
type CreateTransactionPayload {
  # The created/modified resource
  transaction: Transaction

  # Any related resources that were affected
  account: Account
  budget: Budget

  # Operation metadata
  success: Boolean!

  # Error information
  errors: [UserError!]!

  # Client mutation ID for optimistic updates
  clientMutationId: String
}

type UserError {
  field: String
  message: String!
  code: String!
}

# Input with client mutation ID
input CreateTransactionInput {
  householdId: ID!
  amount: MoneyInput!
  description: String!
  categoryId: ID!
  accountId: ID!
  date: DateTime!
  tags: [String!]
  clientMutationId: String
}
\`\`\`

#### Error Handling in Mutations

\`\`\`graphql
type CreateTransactionPayload {
  transaction: Transaction
  errors: [UserError!]!
  success: Boolean!
}

# Example error response
{
  "data": {
    "createTransaction": {
      "transaction": null,
      "success": false,
      "errors": [
        {
          "field": "amount",
          "message": "Amount must be positive",
          "code": "POSITIVE_NUMBER_REQUIRED"
        },
        {
          "field": "accountId",
          "message": "Account not found",
          "code": "RESOURCE_NOT_FOUND"
        }
      ]
    }
  }
}
\`\`\`

### Subscription Design Patterns

#### Real-time Updates

\`\`\`graphql
type Subscription {
  # Resource-specific subscriptions
  transactionAdded(householdId: ID!): Transaction!
  transactionUpdated(householdId: ID!): Transaction!
  transactionDeleted(householdId: ID!): TransactionDeletedPayload!

  # Account balance updates
  accountBalanceChanged(accountId: ID!): AccountBalanceUpdate!

  # Budget alerts
  budgetExceeded(householdId: ID!): BudgetAlert!
  budgetWarning(householdId: ID!): BudgetWarning!

  # Price tracking
  priceAlert(householdId: ID!): PriceAlert!

  # System notifications
  notification(userId: ID!): Notification!
}

type TransactionDeletedPayload {
  deletedTransactionId: ID!
  affectedAccount: Account!
  affectedBudget: Budget
}

type AccountBalanceUpdate {
  account: Account!
  previousBalance: Money!
  newBalance: Money!
  transaction: Transaction
}

type BudgetAlert {
  budget: Budget!
  category: Category!
  spentAmount: Money!
  budgetAmount: Money!
  percentageUsed: Float!
}
\`\`\`

### Custom Scalar Types

#### Money Type Implementation

\`\`\`graphql
scalar Money

# Usage in schema
type Transaction {
  amount: Money!
  originalAmount: Money
}

input MoneyInput {
  amount: Int!        # Amount in smallest currency unit (cents)
  currency: Currency!
}

# Serialization format
{
  "amount": {
    "amount": 5000000,    # 50,000.00 IDR in cents
    "currency": "IDR"
  }
}
\`\`\`

#### DateTime Type Implementation

\`\`\`graphql
scalar DateTime

# Usage in schema
type Transaction {
  date: DateTime!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Serialization format (ISO 8601)
{
  "date": "2024-01-15T00:00:00Z",
  "createdAt": "2024-01-15T10:30:00.123Z"
}
\`\`\`

### Performance Optimization

#### DataLoader Pattern

\`\`\`typescript
// Batch loading to prevent N+1 queries
class CategoryLoader {
  private loader = new DataLoader<string, Category>(
    async (categoryIds: readonly string[]) => {
      const categories = await this.categoryService.findByIds([...categoryIds]);
      return categoryIds.map(id =>
        categories.find(category => category.id === id) || null
      );
    }
  );

  async load(id: string): Promise<Category | null> {
    return this.loader.load(id);
  }
}

// Usage in resolver
@ResolveField(() => Category)
async category(@Parent() transaction: Transaction): Promise<Category | null> {
  return this.categoryLoader.load(transaction.categoryId);
}
\`\`\`

#### Query Complexity Analysis

\`\`\`typescript
// Limit query complexity to prevent abuse
const depthLimit = require('graphql-depth-limit');
const costAnalysis = require('graphql-cost-analysis');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(10), // Maximum query depth
    costAnalysis({
      maximumCost: 1000,
      defaultCost: 1,
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10,
      introspectionCost: 1000,
      createError: (max, actual) => {
        return new Error(`Query cost ${actual} exceeds maximum cost ${max}`);
      },
    }),
  ],
});
\`\`\`

#### Field-Level Caching

\`\`\`typescript
// Cache expensive field calculations
@ResolveField(() => Money)
@UseInterceptors(CacheInterceptor)
@CacheTTL(300) // 5 minutes
async netWorth(@Parent() household: Household): Promise<Money> {
  return this.householdService.calculateNetWorth(household.id);
}

// Cache key generation
@CacheKey((household: Household) => `netWorth:${household.id}`)
async netWorth(@Parent() household: Household): Promise<Money> {
  return this.householdService.calculateNetWorth(household.id);
}
\`\`\`

### Documentation Standards

#### Schema Documentation

\`\`\`graphql
"""
Represents a financial transaction within a household.
Transactions follow double-entry accounting principles.
"""
type Transaction implements Node & Timestamped {
  """
  Unique identifier for the transaction.
  """
  id: ID!

  """
  The household this transaction belongs to.
  """
  householdId: ID!

  """
  Transaction amount in the account's currency.
  Always positive - the transaction type determines debit/credit.
  """
  amount: Money!

  """
  Original transaction amount if different from account currency.
  Used for multi-currency transactions with exchange rate conversion.
  """
  originalAmount: Money

  """
  Exchange rate used for currency conversion.
  Only present when originalAmount differs from amount currency.
  """
  exchangeRate: Float

  """
  Human-readable description of the transaction.
  Should be descriptive enough to identify the transaction purpose.
  """
  description: String!

  """
  Date when the transaction occurred (not when it was recorded).
  Used for financial reporting and categorization.
  """
  date: DateTime!

  """
  Timestamp when this transaction was created in the system.
  """
  createdAt: DateTime!

  """
  Timestamp when this transaction was last modified.
  """
  updatedAt: DateTime!
}
\`\`\`

#### Resolver Documentation

\`\`\``typescript
/**
 * Retrieves transactions for a household with filtering and pagination.
 *
 * @param householdId - The household to retrieve transactions for
 * @param filters - Optional filters to apply to the transaction list
 * @param pagination - Pagination parameters for cursor-based pagination
 * @param sorting - Sort order for the results
 * @returns Connection object with transactions and pagination info
 *
 * @example
 * ```graphql
 * query GetTransactions($householdId: ID!) {
 *   transactions(
 *     householdId: $householdId
 *     filters: { dateRange: { start: "2024-01-01", end: "2024-01-31" } }
 *     pagination: { first: 20 }
 *     sorting: { field: DATE, direction: DESC }
 *   ) {
 *     edges {
 *       node {
 *         id
 *         amount
 *         description
 *         date
 *       }
 *     }
 *     pageInfo {
 *       hasNextPage
 *       endCursor
 *     }
 *   }
 * }
 * ```
 */
@Query(() => TransactionConnection)
async transactions(
  @Args('householdId') householdId: string,
  @Args('filters', { nullable: true }) filters?: TransactionFilters,
  @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  @Args('sorting', { nullable: true }) sorting?: SortingInput,
): Promise<TransactionConnection> {
  return this.transactionService.findTransactions({
    householdId,
    filters,
    pagination,
    sorting
  });
}
\`\`\``

This comprehensive API design standard ensures consistent, maintainable, and developer-friendly APIs
that support the complex financial management requirements of the Permoney application.
