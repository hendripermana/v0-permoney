import { formatMoney, generateId, slugify } from './utils';

describe('Utils', () => {
  describe('formatMoney', () => {
    it('should format IDR currency correctly', () => {
      const money = { amount: 1000000, currency: 'IDR' as const };
      const formatted = formatMoney(money);
      expect(formatted).toContain('1.000.000');
    });
  });

  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('slugify', () => {
    it('should convert text to slug format', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test & Example')).toBe('test-example');
    });
  });
});
