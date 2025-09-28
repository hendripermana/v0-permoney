import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BudgetsService } from '../../budgets/budgets.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Budget {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  period: string;
}

@Resolver(() => Budget)
export class BudgetsResolver {
  constructor(private budgetsService: BudgetsService) {}

  @Query(() => [Budget])
  async budgets(
    @Args('householdId', { type: () => ID }) householdId: string,
  ): Promise<Budget[]> {
    // Placeholder implementation
    return [];
  }
}
