# Recurring Transaction System

The Recurring Transaction System provides comprehensive support for automated, scheduled
transactions in the Permoney application. This system enables users to set up recurring payments,
income, and transfers that execute automatically based on flexible scheduling rules.

## Features

### Core Functionality

- **Flexible Scheduling**: Support for daily, weekly, monthly, yearly, and custom interval
  frequencies
- **Automatic Execution**: Background job processing with cron-based scheduling
- **Failure Handling**: Comprehensive retry mechanisms and error tracking
- **Status Management**: Active, paused, completed, and cancelled states
- **Execution Tracking**: Complete audit trail of all executions and attempts

### Advanced Features

- **Multi-Currency Support**: Full support for different currencies with exchange rate handling
- **Transfer Support**: Recurring transfers between accounts
- **Execution Limits**: Optional maximum execution counts and end dates
- **Manual Execution**: Ability to manually trigger executions outside of schedule
- **Comprehensive Permissions**: Integration with household permission system

## Architecture

### Components

1. **RecurringTransactionService**: Core business logic and orchestration
2. **RecurringTransactionRepository**: Data access layer with Prisma integration
3. **RecurringTransactionController**: REST API endpoints
4. **RecurringTransactionScheduler**: Background job scheduling with cron
5. **DTOs**: Comprehensive data transfer objects with validation

### Database Schema

#### RecurringTransaction Table

\`\`\`sql
CREATE TABLE "recurring_transactions" (
    "id" UUID PRIMARY KEY,
    "household_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'IDR',
    "account_id" UUID NOT NULL,
    "transfer_account_id" UUID,
    "category_id" UUID,
    "merchant" VARCHAR(255),
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval_value" INTEGER DEFAULT 1,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "next_execution_date" DATE NOT NULL,
    "last_execution_date" DATE,
    "execution_count" INTEGER DEFAULT 0,
    "max_executions" INTEGER,
    "status" "RecurringTransactionStatus" DEFAULT 'ACTIVE',
    "metadata" JSONB DEFAULT '{}',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);
\`\`\`

#### RecurringTransactionExecution Table

\`\`\`sql
CREATE TABLE "recurring_transaction_executions" (
    "id" UUID PRIMARY KEY,
    "recurring_transaction_id" UUID NOT NULL,
    "transaction_id" UUID,
    "scheduled_date" DATE NOT NULL,
    "executed_date" TIMESTAMP,
    "status" VARCHAR(50) DEFAULT 'PENDING',
    "error_message" TEXT,
    "retry_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Enums

#### RecurrenceFrequency

- `DAILY`: Execute every N days
- `WEEKLY`: Execute every N weeks
- `MONTHLY`: Execute every N months
- `YEARLY`: Execute every N years
- `CUSTOM`: Execute every N days (flexible custom interval)

#### RecurringTransactionStatus

- `ACTIVE`: Currently active and will execute on schedule
- `PAUSED`: Temporarily paused, can be resumed
- `COMPLETED`: Finished (reached max executions or end date)
- `CANCELLED`: Permanently cancelled by user

## API Endpoints

### Base URL: `/households/:householdId/recurring-transactions`

#### Create Recurring Transaction

\`\`\`http
POST /households/:householdId/recurring-transactions
Content-Type: application/json

{
  "name": "Monthly Rent",
  "description": "Monthly apartment rent payment",
  "amountCents": 150000000,
  "currency": "IDR",
  "accountId": "account-123",
  "categoryId": "category-housing",
  "merchant": "Landlord",
  "frequency": "MONTHLY",
  "intervalValue": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "maxExecutions": 12
}
\`\`\`

#### Get Recurring Transactions

\`\`\`http
GET /households/:householdId/recurring-transactions?status=ACTIVE&frequency=MONTHLY&page=1&limit=20
\`\`\`

#### Update Recurring Transaction

\`\`\`http
PUT /households/:householdId/recurring-transactions/:id
Content-Type: application/json

{
  "name": "Updated Monthly Rent",
  "amountCents": 160000000,
  "status": "PAUSED"
}
\`\`\`

#### Control Operations

\`\`\`http
POST /households/:householdId/recurring-transactions/:id/pause
POST /households/:householdId/recurring-transactions/:id/resume
POST /households/:householdId/recurring-transactions/:id/cancel
\`\`\`

#### Manual Execution

\`\`\`http
POST /households/:householdId/recurring-transactions/:id/execute
Content-Type: application/json

{
  "executionDate": "2024-02-01",
  "force": true
}
\`\`\`

#### Execution History

\`\`\`http
GET /households/:householdId/recurring-transactions/:id/executions
\`\`\`

## Scheduling System

### Automatic Processing

The system uses NestJS's `@nestjs/schedule` package with cron jobs:

- **Hourly Processing**: Checks for due recurring transactions every hour
- **Retry Processing**: Retries failed executions every 6 hours
- **Configurable**: Cron expressions can be modified for different environments

### Execution Logic

1. **Due Check**: Find all active recurring transactions where `next_execution_date <= current_date`
2. **Validation**: Verify transaction is still valid (not ended, under max executions)
3. **Execution**: Create actual transaction using TransactionsService
4. **Update**: Update execution count and calculate next execution date
5. **Completion**: Mark as completed if limits reached

### Failure Handling

- **Retry Mechanism**: Failed executions are retried up to 3 times
- **Error Tracking**: All errors are logged with detailed messages
- **Graceful Degradation**: System continues processing other transactions if one fails

## Usage Examples

### Monthly Subscription

\`\`\`typescript
const subscription = await recurringTransactionService.create(householdId, userId, {
  name: 'Netflix Subscription',
  description: 'Monthly Netflix subscription',
  amountCents: 5400000, // 54,000 IDR
  accountId: 'credit-card-account',
  categoryId: 'entertainment-category',
  frequency: RecurrenceFrequency.MONTHLY,
  intervalValue: 1,
  startDate: '2024-01-01',
});
\`\`\`

### Bi-weekly Salary

\`\`\`typescript
const salary = await recurringTransactionService.create(householdId, userId, {
  name: 'Bi-weekly Salary',
  description: 'Salary deposit every 2 weeks',
  amountCents: -1500000000, // Negative for income
  accountId: 'checking-account',
  categoryId: 'salary-category',
  frequency: RecurrenceFrequency.WEEKLY,
  intervalValue: 2,
  startDate: '2024-01-01',
});
\`\`\`

### Limited Duration Recurring Transaction

\`\`\`typescript
const gymMembership = await recurringTransactionService.create(householdId, userId, {
  name: 'Gym Membership',
  description: 'Monthly gym membership',
  amountCents: 50000000,
  accountId: 'checking-account',
  categoryId: 'health-category',
  frequency: RecurrenceFrequency.MONTHLY,
  intervalValue: 1,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  maxExecutions: 12,
});
\`\`\`

## Error Handling

### Common Error Scenarios

1. **Insufficient Funds**: Transaction creation fails due to account balance
2. **Account Not Found**: Referenced account no longer exists
3. **Permission Denied**: User lacks permission to create transactions
4. **Invalid Schedule**: End date before start date, invalid frequency

### Error Recovery

- **Automatic Retry**: Failed executions are automatically retried
- **Manual Intervention**: Users can manually execute or fix issues
- **Status Updates**: Clear status indicators for troubleshooting
- **Detailed Logging**: Comprehensive error messages and stack traces

## Testing

### Unit Tests

- Service layer business logic
- Repository data access methods
- Date calculation algorithms
- Error handling scenarios

### Integration Tests

- End-to-end workflow testing
- Database transaction integrity
- Permission system integration
- Scheduler functionality

### Manual Testing

- HTTP file with comprehensive test scenarios
- Different frequency patterns
- Edge cases and error conditions

## Performance Considerations

### Database Optimization

- Indexed fields for efficient querying
- Pagination support for large datasets
- Optimized queries for due transaction lookup

### Scheduling Efficiency

- Batch processing of due transactions
- Configurable batch sizes
- Efficient retry mechanisms

### Memory Management

- Streaming for large result sets
- Proper cleanup of resources
- Connection pooling optimization

## Security

### Permission System

- Integration with household permission system
- Role-based access control
- User attribution for all operations

### Data Validation

- Comprehensive input validation
- SQL injection prevention
- XSS protection in API responses

### Audit Trail

- Complete execution history
- User action tracking
- Error logging and monitoring

## Monitoring and Observability

### Metrics

- Execution success/failure rates
- Processing times
- Queue depths and backlogs

### Logging

- Structured logging with correlation IDs
- Error tracking and alerting
- Performance monitoring

### Health Checks

- Scheduler health monitoring
- Database connectivity checks
- External service dependencies

## Future Enhancements

### Planned Features

- **Smart Scheduling**: AI-powered optimal execution timing
- **Conditional Execution**: Execute based on account balance or other conditions
- **Notification System**: Alerts for failed executions or upcoming payments
- **Bulk Operations**: Mass create/update recurring transactions
- **Template System**: Predefined templates for common recurring transactions

### Scalability Improvements

- **Distributed Processing**: Multi-instance job processing
- **Queue System**: Redis-based job queue for high volume
- **Sharding**: Database sharding for large-scale deployments

## Troubleshooting

### Common Issues

1. **Transactions Not Executing**: Check scheduler status and cron configuration
2. **Permission Errors**: Verify user has appropriate household permissions
3. **Date Calculation Issues**: Validate timezone settings and date formats
4. **Performance Problems**: Monitor database query performance and indexing

### Debug Tools

- Execution history API for troubleshooting
- Manual execution for testing
- Comprehensive logging for issue diagnosis
- Health check endpoints for system status

## Configuration

### Environment Variables

\`\`\`env
# Scheduler configuration
RECURRING_TRANSACTION_BATCH_SIZE=100
RECURRING_TRANSACTION_RETRY_LIMIT=3
RECURRING_TRANSACTION_PROCESSING_INTERVAL=3600000

# Database configuration
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
\`\`\`

### Feature Flags

- Enable/disable automatic processing
- Configure retry limits
- Adjust processing intervals
- Toggle notification features
