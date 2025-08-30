import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

export interface ParsedProductInfo {
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
  merchant: string;
  isValid: boolean;
}

@Injectable()
export class EcommerceParserService {
  private readonly logger = new Logger(EcommerceParserService.name);

  async parseProductUrl(url: string): Promise<ParsedProductInfo> {
    try {
      const merchant = this.identifyMerchant(url);
      
      switch (merchant) {
        case 'Tokopedia':
          return await this.parseTokopedia(url);
        case 'Shopee':
          return await this.parseShopee(url);
        case 'Blibli':
          return await this.parseBlibli(url);
        default:
          return await this.parseGeneric(url, merchant);
      }
    } catch (error) {
      this.logger.error(`Failed to parse product URL: ${url}`, error);
      return {
        name: 'Unknown Product',
        price: 0,
        currency: 'IDR',
        merchant: 'Unknown',
        isValid: false,
      };
    }
  }

  private identifyMerchant(url: string): string {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('tokopedia.com')) return 'Tokopedia';
    if (hostname.includes('shopee.co.id')) return 'Shopee';
    if (hostname.includes('blibli.com')) return 'Blibli';
    if (hostname.includes('lazada.co.id')) return 'Lazada';
    if (hostname.includes('bukalapak.com')) return 'Bukalapak';
    
    return hostname;
  }

  private async parseTokopedia(url: string): Promise<ParsedProductInfo> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Tokopedia selectors (these may need updates as the site changes)
      const name = $('h1[data-testid="lblPDPDetailProductName"]').text().trim() ||
                   $('h1').first().text().trim() ||
                   'Tokopedia Product';
      
      const priceText = $('[data-testid="lblPDPDetailProductPrice"]').text().trim() ||
                       $('.price').first().text().trim() ||
                       '0';
      
      const imageUrl = $('img[data-testid="PDPImageMain"]').attr('src') ||
                      $('img').first().attr('src');
      
      const price = this.extractPrice(priceText);
      
      return {
        name,
        price,
        currency: 'IDR',
        imageUrl,
        merchant: 'Tokopedia',
        isValid: price > 0 && name !== 'Tokopedia Product',
      };
    } catch (error) {
      this.logger.error('Failed to parse Tokopedia URL', error);
      return this.createFallbackResult('Tokopedia', url);
    }
  }

  private async parseShopee(url: string): Promise<ParsedProductInfo> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Shopee selectors
      const name = $('span[data-testid="product-name"]').text().trim() ||
                   $('.product-name').text().trim() ||
                   $('h1').first().text().trim() ||
                   'Shopee Product';
      
      const priceText = $('.product-price').text().trim() ||
                       $('[data-testid="product-price"]').text().trim() ||
                       '0';
      
      const imageUrl = $('img[data-testid="product-image"]').attr('src') ||
                      $('.product-image img').first().attr('src');
      
      const price = this.extractPrice(priceText);
      
      return {
        name,
        price,
        currency: 'IDR',
        imageUrl,
        merchant: 'Shopee',
        isValid: price > 0 && name !== 'Shopee Product',
      };
    } catch (error) {
      this.logger.error('Failed to parse Shopee URL', error);
      return this.createFallbackResult('Shopee', url);
    }
  }

  private async parseBlibli(url: string): Promise<ParsedProductInfo> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Blibli selectors
      const name = $('h1[data-testid="product-name"]').text().trim() ||
                   $('.product-title').text().trim() ||
                   $('h1').first().text().trim() ||
                   'Blibli Product';
      
      const priceText = $('.product-price').text().trim() ||
                       $('[data-testid="product-price"]').text().trim() ||
                       '0';
      
      const imageUrl = $('img[data-testid="product-image"]').attr('src') ||
                      $('.product-image img').first().attr('src');
      
      const price = this.extractPrice(priceText);
      
      return {
        name,
        price,
        currency: 'IDR',
        imageUrl,
        merchant: 'Blibli',
        isValid: price > 0 && name !== 'Blibli Product',
      };
    } catch (error) {
      this.logger.error('Failed to parse Blibli URL', error);
      return this.createFallbackResult('Blibli', url);
    }
  }

  private async parseGeneric(url: string, merchant: string): Promise<ParsedProductInfo> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Generic selectors for common e-commerce patterns
      const name = $('h1').first().text().trim() ||
                   $('.product-name').text().trim() ||
                   $('.product-title').text().trim() ||
                   $('title').text().trim() ||
                   'Product';
      
      const priceText = $('.price').first().text().trim() ||
                       $('.product-price').text().trim() ||
                       $('[class*="price"]').first().text().trim() ||
                       '0';
      
      const imageUrl = $('img[class*="product"]').first().attr('src') ||
                      $('img').first().attr('src');
      
      const price = this.extractPrice(priceText);
      
      return {
        name,
        price,
        currency: 'IDR',
        imageUrl,
        merchant,
        isValid: price > 0 && name !== 'Product',
      };
    } catch (error) {
      this.logger.error(`Failed to parse generic URL: ${url}`, error);
      return this.createFallbackResult(merchant, url);
    }
  }

  private extractPrice(priceText: string): number {
    // Remove common Indonesian currency symbols and formatting
    const cleanPrice = priceText
      .replace(/Rp\.?/gi, '')
      .replace(/IDR/gi, '')
      .replace(/[.,]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^\d]/g, '');
    
    const price = parseInt(cleanPrice, 10);
    return isNaN(price) ? 0 : price;
  }

  private createFallbackResult(merchant: string, url: string): ParsedProductInfo {
    // Extract product name from URL path as fallback
    const urlPath = new URL(url).pathname;
    const segments = urlPath.split('/').filter(segment => segment.length > 0);
    const lastSegment = segments[segments.length - 1] || 'product';
    
    const name = lastSegment
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    return {
      name,
      price: 0,
      currency: 'IDR',
      merchant,
      isValid: false,
    };
  }
}
