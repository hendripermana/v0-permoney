import { PartialType } from '@nestjs/mapped-types';
import { CreateWishlistItemDto } from './create-wishlist-item.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateWishlistItemDto extends PartialType(CreateWishlistItemDto) {
  @IsOptional()
  @IsBoolean()
  isPurchased?: boolean;
}
