# Coding Standards & Conventions

## Overview

This document establishes coding standards and naming conventions for the Permoney project to ensure
consistency, maintainability, and code quality across the development team.

## General Principles

- **Consistency**: Follow established patterns throughout the codebase
- **Readability**: Write code that tells a story and is self-documenting
- **Maintainability**: Structure code for easy modification and extension
- **Performance**: Consider performance implications of coding decisions
- **Security**: Follow secure coding practices by default

## TypeScript Standards

### File Naming Conventions

\`\`\`
// Files and directories
kebab-case for files and directories
PascalCase for React components
camelCase for utilities and services

Examples:
- user-service.ts
- UserProfile.tsx
- api-client.ts
- TransactionForm.tsx
- utils/format-currency.ts
\`\`\`

### Variable and Function Naming

\`\`\`typescript
// Variables: camelCase
const userName = 'john_doe';
const isAuthenticated = true;
const transactionList = [];

// Functions: camelCase with descriptive verbs
function calculateNetWorth() {}
function validateTransaction() {}
function formatCurrency() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_TRANSACTION_AMOUNT = 1000000;
const DEFAULT_CURRENCY = 'IDR';
const API_ENDPOINTS = {
  TRANSACTIONS: '/api/v1/transactions',
  ACCOUNTS: '/api/v1/accounts',
};

// Types and Interfaces: PascalCase
interface UserProfile {
  id: string;
  name: string;
}

type TransactionStatus = 'pending' | 'completed' | 'failed';

// Enums: PascalCase with descriptive values
enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
}
\`\`\`

### Code Organization

\`\`\`typescript
// File structure order:
// 1. Imports (external libraries first, then internal)
// 2. Types and interfaces
// 3. Constants
// 4. Main implementation
// 5. Default export (if applicable)

import React from 'react';
import { z } from 'zod';

import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TransactionFormProps {
  onSubmit: (data: TransactionData) => void;
}

const FORM_VALIDATION_SCHEMA = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
});

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  // Implementation
}
\`\`\`

## React Component Standards

### Component Structure

\`\`\`typescript
// Functional components with TypeScript
interface ComponentProps {
  // Props interface always defined
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks (useState, useEffect, custom hooks)
  // 2. Derived state and computations
  // 3. Event handlers
  // 4. Render logic

  return (
    <div className="component-wrapper">
      {/* JSX */}
    </div>
  );
}
\`\`\`

### Props and State Naming

\`\`\`typescript
// Props: descriptive and specific
interface UserCardProps {
  user: User;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  isLoading?: boolean;
  className?: string;
}

// State: descriptive with clear intent
const [isSubmitting, setIsSubmitting] = useState(false);
const [formData, setFormData] = useState<FormData>({});
const [validationErrors, setValidationErrors] = useState<string[]>([]);
\`\`\`

### Event Handler Naming

\`\`\`typescript
// Event handlers: handle + Action
const handleSubmit = (event: FormEvent) => {};
const handleUserEdit = (userId: string) => {};
const handlePasswordChange = (newPassword: string) => {};

// Async handlers
const handleAsyncSubmit = async (data: FormData) => {};
\`\`\`

## Backend Standards (NestJS)

### Module Structure

\`\`\`typescript
// Controllers: PascalCase + Controller suffix
@Controller('transactions')
export class TransactionController {
  // Methods: HTTP verb + descriptive action
  @Get()
  async findAll() {}

  @Post()
  async create(@Body() createDto: CreateTransactionDto) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {}
}

// Services: PascalCase + Service suffix
@Injectable()
export class TransactionService {
  // Methods: descriptive verbs
  async createTransaction(data: CreateTransactionDto) {}
  async calculateBalance(accountId: string) {}
  async validateTransaction(transaction: Transaction) {}
}

// DTOs: PascalCase + Dto suffix
export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
\`\`\`

### Database Naming

\`\`\`typescript
// Entity names: PascalCase
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Column names: snake_case in database, camelCase in entity
  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'amount_cents' })
  amountCents: number;
}

// Repository methods: descriptive actions
class TransactionRepository {
  async findByHouseholdId(householdId: string) {}
  async findByDateRange(startDate: Date, endDate: Date) {}
  async calculateTotalByCategory(categoryId: string) {}
}
\`\`\`

## Error Handling Standards

\`\`\`typescript
// Custom error classes: PascalCase + Error suffix
export class InsufficientFundsError extends Error {
  constructor(
    public readonly accountId: string,
    public readonly requestedAmount: number,
    public readonly availableAmount: number
  ) {
    super(`Insufficient funds in account ${accountId}`);
    this.name = 'InsufficientFundsError';
  }
}

// Error handling in services
async function processTransaction(data: TransactionData) {
  try {
    // Implementation
  } catch (error) {
    if (error instanceof InsufficientFundsError) {
      // Handle specific error
    }

    // Log and re-throw
    logger.error('Transaction processing failed', { error, data });
    throw error;
  }
}
\`\`\`

## Testing Standards

### Test File Naming

\`\`\`
// Test files: same name as source + .test or .spec
user-service.ts → user-service.test.ts
UserProfile.tsx → UserProfile.test.tsx

// Test directories
src/
  components/
    UserProfile.tsx
    __tests__/
      UserProfile.test.tsx
\`\`\`

### Test Structure

\`\`\`typescript
describe('TransactionService', () => {
  // Setup and teardown
  beforeEach(() => {
    // Test setup
  });

  describe('createTransaction', () => {
    it('should create a valid transaction', async () => {
      // Arrange
      const transactionData = createMockTransactionData();

      // Act
      const result = await service.createTransaction(transactionData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
    });

    it('should throw InsufficientFundsError when balance is low', async () => {
      // Arrange
      const transactionData = createMockTransactionData({ amount: 999999 });

      // Act & Assert
      await expect(service.createTransaction(transactionData)).rejects.toThrow(
        InsufficientFundsError
      );
    });
  });
});
\`\`\`

## Import Organization

\`\`\`typescript
// Import order:
// 1. Node modules (React, external libraries)
// 2. Internal modules (grouped by type)
// 3. Relative imports

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

import { formatCurrency } from '@/lib/utils';
import { transactionSchema } from '@/lib/validations';

import { useTransactions } from '@/hooks/use-transactions';
import { useAuth } from '@/hooks/use-auth';

import './TransactionForm.css';
\`\`\`

## Documentation Standards

### Code Comments

\`\`\`typescript
/**
 * Calculates the net worth for a household by summing all asset values
 * and subtracting all liability values, converted to the base currency.
 *
 * @param householdId - The unique identifier for the household
 * @param baseCurrency - The currency to convert all values to (default: IDR)
 * @returns Promise resolving to the net worth in the specified currency
 *
 * @throws {HouseholdNotFoundError} When household doesn't exist
 * @throws {CurrencyConversionError} When exchange rates are unavailable
 */
async function calculateNetWorth(
  householdId: string,
  baseCurrency: Currency = 'IDR'
): Promise<Money> {
  // Implementation with inline comments for complex logic
  const accounts = await this.accountService.findByHousehold(householdId);

  // Convert all account balances to base currency
  const convertedBalances = await Promise.all(
    accounts.map(account => this.convertToBaseCurrency(account, baseCurrency))
  );

  return convertedBalances.reduce((total, balance) => total + balance, 0);
}
\`\`\`

### README Documentation

\`\`\``markdown
# Component/Module Name

Brief description of what this component/module does.

## Usage

\`\`\`typescript
// Code example showing how to use
\`\`\`
\`\`\``

## Props/Parameters

| Name  | Type   | Required | Description          |
| ----- | ------ | -------- | -------------------- |
| prop1 | string | Yes      | Description of prop1 |

## Examples

Practical examples of usage.

\`\`\``

## Performance Guidelines

### React Performance

\`\`\`typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Component implementation
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Use useCallback for event handlers passed to children
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
\`\`\``

### Database Performance

\`\`\`typescript
// Use proper indexing hints in queries
const transactions = await this.transactionRepository
  .createQueryBuilder('transaction')
  .where('transaction.householdId = :householdId', { householdId })
  .andWhere('transaction.date >= :startDate', { startDate })
  .orderBy('transaction.date', 'DESC')
  .limit(100)
  .getMany();

// Avoid N+1 queries with proper relations
const transactionsWithCategories = await this.transactionRepository.find({
  where: { householdId },
  relations: ['category', 'account'],
  order: { date: 'DESC' },
});
\`\`\`

## Security Guidelines

\`\`\`typescript
// Input validation with Zod schemas
const createTransactionSchema = z.object({
  amount: z.number().positive().max(1000000),
  description: z.string().min(1).max(500),
  categoryId: z.string().uuid(),
});

// Sanitize user inputs
function sanitizeDescription(description: string): string {
  return description.trim().replace(/[<>]/g, '');
}

// Use parameterized queries (handled by Prisma/TypeORM)
// Never concatenate user input into SQL strings
\`\`\`

## Accessibility Standards

\`\`\`typescript
// Use semantic HTML elements
<button type="button" onClick={handleClick}>
  Submit Transaction
</button>

// Provide proper ARIA labels
<input
  type="number"
  aria-label="Transaction amount"
  aria-describedby="amount-help"
/>
<div id="amount-help">Enter the transaction amount in IDR</div>

// Ensure keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={handleClick}
>
  Custom Button
</div>
\`\`\`

## Code Review Checklist

Before submitting code for review, ensure:

- [ ] Code follows naming conventions
- [ ] Functions are single-purpose and well-named
- [ ] Complex logic is commented
- [ ] Error handling is implemented
- [ ] Tests are written and passing
- [ ] No console.log statements in production code
- [ ] TypeScript types are properly defined
- [ ] Security best practices are followed
- [ ] Performance considerations are addressed
- [ ] Accessibility requirements are met

## Tools and Automation

### ESLint Configuration

The project uses ESLint with custom rules to enforce these standards automatically.

### Prettier Configuration

Code formatting is handled by Prettier with the following key settings:

- 2 spaces for indentation
- Single quotes for strings
- Trailing commas where valid
- Line length limit of 100 characters

### Husky Pre-commit Hooks

Pre-commit hooks ensure code quality:

- ESLint checks
- Prettier formatting
- TypeScript compilation
- Test execution
- Commit message validation
