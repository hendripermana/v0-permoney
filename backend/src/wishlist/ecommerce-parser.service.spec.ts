import { Test, TestingModule } from '@nestjs/testing';
import { EcommerceParserService } from './ecommerce-parser.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('EcommerceParserService', () => {
  let service: EcommerceParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EcommerceParserService],
    }).compile();

    service = module.get<EcommerceParserService>(EcommerceParserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseProductUrl', () => {
    it('should identify Tokopedia merchant', async () => {
      const mockHtml = `
        <html>
          <head><title>Test Product - Tokopedia</title></head>
          <body>
            <h1 data-testid="lblPDPDetailProductName">Test Product</h1>
            <div data-testid="lblPDPDetailProductPrice">Rp100.000</div>
            <img data-testid="PDPImageMain" src="https://example.com/image.jpg" />
          </body>
        </html>
      `;

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const result = await service.parseProductUrl('https://tokopedia.com/test-product');

      expect(result.merchant).toBe('Tokopedia');
      expect(result.name).toBe('Test Product');
      expect(result.price).toBe(100000);
      expect(result.currency).toBe('IDR');
      expect(result.isValid).toBe(true);
    });

    it('should identify Shopee merchant', async () => {
      const mockHtml = `
        <html>
          <head><title>Test Product - Shopee</title></head>
          <body>
            <span data-testid="product-name">Test Product</span>
            <div class="product-price">Rp50.000</div>
          </body>
        </html>
      `;

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const result = await service.parseProductUrl('https://shopee.co.id/test-product');

      expect(result.merchant).toBe('Shopee');
      expect(result.name).toBe('Test Product');
      expect(result.price).toBe(50000);
      expect(result.currency).toBe('IDR');
      expect(result.isValid).toBe(true);
    });

    it('should handle parsing errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await service.parseProductUrl('https://tokopedia.com/test-product');

      expect(result.isValid).toBe(false);
      expect(result.name).toBe('Unknown Product');
      expect(result.price).toBe(0);
      expect(result.merchant).toBe('Unknown');
    });

    it('should extract price from Indonesian currency format', async () => {
      const mockHtml = `
        <html>
          <body>
            <h1>Test Product</h1>
            <div class="price">Rp1.500.000</div>
          </body>
        </html>
      `;

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const result = await service.parseProductUrl('https://example.com/test-product');

      expect(result.price).toBe(1500000);
    });

    it('should create fallback result for unknown merchants', async () => {
      const result = await service.parseProductUrl('https://unknown-site.com/product-name-here');

      expect(result.merchant).toBe('unknown-site.com');
      expect(result.name).toBe('Product Name Here');
      expect(result.isValid).toBe(false);
    });
  });

  describe('price extraction', () => {
    it('should extract price from various formats', () => {
      const testCases = [
        { input: 'Rp100.000', expected: 100000 },
        { input: 'Rp 1.500.000', expected: 1500000 },
        { input: 'IDR 50,000', expected: 50000 },
        { input: '250000', expected: 250000 },
        { input: 'Rp.75.000', expected: 75000 },
        { input: 'invalid price', expected: 0 },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service['extractPrice'](input);
        expect(result).toBe(expected);
      });
    });
  });
});
