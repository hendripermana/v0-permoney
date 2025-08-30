import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WishlistService } from '../../wishlist/wishlist.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class WishlistItem {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  url: string;
}

@Resolver(() => WishlistItem)
@UseGuards(JwtAuthGuard)
export class WishlistResolver {
  constructor(private wishlistService: WishlistService) {}

  @Query(() => [WishlistItem])
  async wishlistItems(
    @Args('householdId', { type: () => ID }) householdId: string,
  ): Promise<WishlistItem[]> {
    // Placeholder implementation
    return [];
  }
}
