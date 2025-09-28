import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

// Import resolvers
import { AccountsResolver } from './resolvers/accounts.resolver';
import { TransactionsResolver } from './resolvers/transactions.resolver';
import { HouseholdResolver } from './resolvers/household.resolver';
import { DebtsResolver } from './resolvers/debts.resolver';
import { BudgetsResolver } from './resolvers/budgets.resolver';
import { AnalyticsResolver } from './resolvers/analytics.resolver';
import { AIInsightsResolver } from './resolvers/ai-insights.resolver';
import { DashboardResolver } from './resolvers/dashboard.resolver';
import { SubscriptionsResolver } from './resolvers/subscriptions.resolver';

// Import data loaders
import { AccountsDataLoader } from './dataloaders/accounts.dataloader';
import { TransactionsDataLoader } from './dataloaders/transactions.dataloader';
import { CategoriesDataLoader } from './dataloaders/categories.dataloader';
import { UsersDataLoader } from './dataloaders/users.dataloader';

// Import services
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { HouseholdModule } from '../household/household.module';
import { DebtsModule } from '../debts/debts.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { AIInsightsModule } from '../ai-insights/ai-insights.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'backend/src/graphql/schema.gql'),
        sortSchema: true,
        introspection: true,
        plugins: [
          configService.get('NODE_ENV') !== 'production' 
            ? ApolloServerPluginLandingPageLocalDefault()
            : undefined
        ].filter(Boolean),
        context: ({ req, res }) => ({ req, res }),
        formatError: (error) => {
          console.error('GraphQL Error:', error);
          return {
            message: error.message,
            code: error.extensions?.['code'],
            path: error.path,
          };
        },
      }),
    }),
    // Import feature modules
    AccountsModule,
    TransactionsModule,
    HouseholdModule,
    DebtsModule,
    BudgetsModule,
    AIInsightsModule,
    PrismaModule,
  ],
  providers: [
    // Resolvers
    AccountsResolver,
    TransactionsResolver,
    HouseholdResolver,
    DebtsResolver,
    BudgetsResolver,
    AnalyticsResolver,
    AIInsightsResolver,
    DashboardResolver,
    SubscriptionsResolver,
    
    // Data loaders
    AccountsDataLoader,
    TransactionsDataLoader,
    CategoriesDataLoader,
    UsersDataLoader,
  ],
  exports: [
    AccountsDataLoader,
    TransactionsDataLoader,
    CategoriesDataLoader,
    UsersDataLoader,
  ],
})
export class GraphQLApiModule {}
