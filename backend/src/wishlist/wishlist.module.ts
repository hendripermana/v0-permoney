import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { WishlistRepository } from './wishlist.repository';
import { PriceTrackingService } from './price-tracking.service';
import { EcommerceParserService } from './ecommerce-parser.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WishlistController],
  providers: [
    WishlistService,
    WishlistRepository,
    PriceTrackingService,
    EcommerceParserService,
  ],
  exports: [WishlistService],
})
export class WishlistModule {}
