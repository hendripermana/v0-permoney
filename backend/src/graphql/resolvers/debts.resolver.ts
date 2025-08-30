import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DebtsService } from '../../debts/debts.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Debt {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  type: string;
}

@Resolver(() => Debt)
@UseGuards(JwtAuthGuard)
export class DebtsResolver {
  constructor(private debtsService: DebtsService) {}

  @Query(() => [Debt])
  async debts(
    @Args('householdId', { type: () => ID }) householdId: string,
  ): Promise<Debt[]> {
    // Placeholder implementation
    return [];
  }
}
