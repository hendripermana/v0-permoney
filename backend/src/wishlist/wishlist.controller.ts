import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistItemDto, UpdateWishlistItemDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  async createWishlistItem(
    @Request() req: any,
    @Body() createWishlistItemDto: CreateWishlistItemDto,
  ) {
    return this.wishlistService.createWishlistItem(
      req.user.householdId,
      req.user.userId,
      createWishlistItemDto,
    );
  }

  @Get()
  async getWishlistItems(@Request() req: any) {
    return this.wishlistService.getWishlistItems(req.user.householdId);
  }

  @Get('goal/:goalId')
  async getWishlistByGoal(@Param('goalId') goalId: string) {
    return this.wishlistService.getWishlistByGoal(goalId);
  }

  @Get(':id')
  async getWishlistItem(@Param('id') id: string) {
    return this.wishlistService.getWishlistItem(id);
  }

  @Put(':id')
  async updateWishlistItem(
    @Param('id') id: string,
    @Body() updateWishlistItemDto: UpdateWishlistItemDto,
  ) {
    return this.wishlistService.updateWishlistItem(id, updateWishlistItemDto);
  }

  @Delete(':id')
  async deleteWishlistItem(@Param('id') id: string) {
    await this.wishlistService.deleteWishlistItem(id);
    return { message: 'Wishlist item deleted successfully' };
  }

  @Post(':id/refresh-price')
  async refreshPrice(@Param('id') id: string) {
    return this.wishlistService.refreshPrice(id);
  }

  @Get(':id/price-history')
  async getPriceHistory(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    return this.wishlistService.getPriceHistory(id, daysNumber);
  }

  @Get(':id/savings-opportunity')
  async getSavingsOpportunity(@Param('id') id: string) {
    return this.wishlistService.getSavingsOpportunity(id);
  }

  @Post(':id/link-goal')
  async linkToGoal(
    @Param('id') id: string,
    @Body('goalId') goalId: string,
  ) {
    return this.wishlistService.linkToGoal(id, goalId);
  }

  @Post(':id/unlink-goal')
  async unlinkFromGoal(@Param('id') id: string) {
    return this.wishlistService.unlinkFromGoal(id);
  }

  @Post(':id/mark-purchased')
  async markAsPurchased(@Param('id') id: string) {
    return this.wishlistService.markAsPurchased(id);
  }
}
