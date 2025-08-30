import { Test, TestingModule } from '@nestjs/testing';
import { WishlistService } from './wishlist.service';
import { WishlistRepository } from './wishlist.repository';
import { EcommerceParserService } from './ecommerce-parser.service';
import { PriceTrackingService } from './price-tracking.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WishlistService', () => {
  let service: WishlistService;
  let repository: jest.Mocked<WishlistRepository>;
  let ecommerceParser: jest.Mocked<EcommerceParserService>;
  let priceTracking: jest.Mocked<PriceTrackingService>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findByHousehold: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addPriceHistory: jest.fn(),
    };

    const mockEcommerceParser = {
      parseProductUrl: jest.fn(),
    };

    const mockPriceTracking = {
      trackSingleItem: jest.fn(),
      getPriceHistory: jest.fn(),
      calculateSavingsOpportunity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: WishlistRepository, useValue: mockRepository },
        { provide: EcommerceParserService, useValue: mockEcommerceParser },
        { provide: PriceTrackingService, useValue: mockPriceTracking },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    repository = module.get(WishlistRepository);
    ecommerceParser = module.get(EcommerceParserService);
    priceTracking = module.get(PriceTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWishlistItem', () => {
    it('should create a wishlist item successfully', async () => {
      const mockProductInfo = {
        name: 'Test Product',
        price: 100000,
        currency: 'IDR',
        merchant: 'Tokopedia',
        imageUrl: 'https://example.com/image.jpg',
        isValid: true,
      };

      const mockWishlistItem = {
        id: '1',
        name: 'Test Product',
        url: 'https://tokopedia.com/test',
        currentPriceCents: 10000000,
        currency: 'IDR',
        merchant: 'Tokopedia',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ecommerceParser.parseProductUrl.mockResolvedValue(mockProductInfo);
      repository.create.mockResolvedValue(mockWishlistItem as any);
      repository.addPriceHistory.mockResolvedValue({} as any);

      const result = await service.createWishlistItem('household-1', 'user-1', {
        name: 'Test Product',
        url: 'https://tokopedia.com/test',
        currency: 'IDR',
      });

      expect(ecommerceParser.parseProductUrl).toHaveBeenCalledWith('https://tokopedia.com/test');
      expect(repository.create).toHaveBeenCalled();
      expect(repository.addPriceHistory).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for invalid URL', async () => {
      const mockProductInfo = {
        name: 'Unknown Product',
        price: 0,
        currency: 'IDR',
        merchant: 'Unknown',
        isValid: false,
      };

      ecommerceParser.parseProductUrl.mockResolvedValue(mockProductInfo);

      await expect(
        service.createWishlistItem('household-1', 'user-1', {
          name: 'Test Product',
          url: 'https://invalid-url.com/test',
          currency: 'IDR',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getWishlistItem', () => {
    it('should return a wishlist item', async () => {
      const mockWishlistItem = {
        id: '1',
        name: 'Test Product',
        currentPriceCents: 10000000,
        currency: 'IDR',
        priceHistory: [],
      };

      repository.findById.mockResolvedValue(mockWishlistItem as any);

      const result = await service.getWishlistItem('1');

      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(result).toBeDefined();
      expect(result.currentPrice).toBe(100000);
    });

    it('should throw NotFoundException for non-existent item', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getWishlistItem('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('refreshPrice', () => {
    it('should refresh price and return updated item', async () => {
      const mockAlert = {
        wishlistItemId: '1',
        itemName: 'Test Product',
        oldPrice: 100000,
        newPrice: 95000,
        priceChange: -5000,
        priceChangePercent: -5,
        targetReached: false,
      };

      const mockUpdatedItem = {
        id: '1',
        name: 'Test Product',
        currentPriceCents: 9500000,
        currency: 'IDR',
        priceHistory: [],
      };

      priceTracking.trackSingleItem.mockResolvedValue(mockAlert);
      repository.findById.mockResolvedValue(mockUpdatedItem as any);

      const result = await service.refreshPrice('1');

      expect(priceTracking.trackSingleItem).toHaveBeenCalledWith('1');
      expect(result.item).toBeDefined();
      expect(result.priceAlert).toEqual(mockAlert);
    });
  });
});
