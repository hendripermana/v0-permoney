import { Resolver, Subscription, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { Transaction } from '../types/transaction.types';
import { Insight } from '../types/analytics.types';

const pubSub = new PubSub();

// Subscription event types
export const TRANSACTION_ADDED = 'transactionAdded';
export const BUDGET_EXCEEDED = 'budgetExceeded';
export const NEW_INSIGHT = 'newInsight';

@Resolver()
export class SubscriptionsResolver {
  @Subscription(() => Transaction, {
    filter: (payload, variables) => {
      return payload.transactionAdded.householdId === variables.householdId;
    },
  })
  transactionAdded(@Args('householdId', { type: () => ID }) householdId: string) {
    return pubSub.asyncIterator(TRANSACTION_ADDED);
  }

  @Subscription(() => String, {
    filter: (payload, variables) => {
      return payload.budgetExceeded.householdId === variables.householdId;
    },
  })
  budgetExceeded(@Args('householdId', { type: () => ID }) householdId: string) {
    return pubSub.asyncIterator(BUDGET_EXCEEDED);
  }

  @Subscription(() => Insight, {
    filter: (payload, variables) => {
      return payload.newInsight.householdId === variables.householdId;
    },
  })
  newInsight(@Args('householdId', { type: () => ID }) householdId: string) {
    return pubSub.asyncIterator(NEW_INSIGHT);
  }
}

// Export pubSub for use in other services
export { pubSub };
