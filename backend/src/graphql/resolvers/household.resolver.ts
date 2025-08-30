import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HouseholdService } from '../../household/household.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Household {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  baseCurrency: string;
}

@Resolver(() => Household)
@UseGuards(JwtAuthGuard)
export class HouseholdResolver {
  constructor(private householdService: HouseholdService) {}

  @Query(() => [Household])
  async households(): Promise<Household[]> {
    // Placeholder implementation
    return [];
  }

  @Query(() => Household, { nullable: true })
  async household(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Household | null> {
    // Placeholder implementation
    return null;
  }
}
