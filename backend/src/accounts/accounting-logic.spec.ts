import { AccountsRepository } from './accounts.repository';
import { AccountType } from '../../../node_modules/.prisma/client';

describe('Double-Entry Accounting Logic Validation', () => {
  let repository: AccountsRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      account: {
        findUnique: jest.fn(),
      },
      ledgerEntry: {
        findMany: jest.fn(),
      },
    };
    repository = new AccountsRepository(mockPrisma);
  });

  describe('Asset Account Balance Calculations', () => {
    it('should correctly calculate balance for asset account with debits and credits', async () => {
      // Asset accounts: Debits increase balance, Credits decrease balance
      const ledgerEntries = [
        { type: 'DEBIT', amountCents: BigInt(100000) },   // +100,000
        { type: 'CREDIT', amountCents: BigInt(30000) },   // -30,000
        { type: 'DEBIT', amountCents: BigInt(50000) },    // +50,000
        { type: 'CREDIT', amountCents: BigInt(20000) },   // -20,000
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.ASSET });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('asset-account-id');

      // Expected: 100,000 - 30,000 + 50,000 - 20,000 = 100,000
      expect(balance).toBe(BigInt(100000));
    });

    it('should handle asset account with only debits', async () => {
      const ledgerEntries = [
        { type: 'DEBIT', amountCents: BigInt(100000) },
        { type: 'DEBIT', amountCents: BigInt(50000) },
        { type: 'DEBIT', amountCents: BigInt(25000) },
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.ASSET });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('asset-account-id');

      // Expected: 100,000 + 50,000 + 25,000 = 175,000
      expect(balance).toBe(BigInt(175000));
    });

    it('should handle asset account with only credits (negative balance)', async () => {
      const ledgerEntries = [
        { type: 'CREDIT', amountCents: BigInt(100000) },
        { type: 'CREDIT', amountCents: BigInt(50000) },
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.ASSET });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('asset-account-id');

      // Expected: -100,000 - 50,000 = -150,000 (negative asset balance)
      expect(balance).toBe(BigInt(-150000));
    });
  });

  describe('Liability Account Balance Calculations', () => {
    it('should correctly calculate balance for liability account with credits and debits', async () => {
      // Liability accounts: Credits increase balance, Debits decrease balance
      const ledgerEntries = [
        { type: 'CREDIT', amountCents: BigInt(100000) },  // +100,000
        { type: 'DEBIT', amountCents: BigInt(30000) },    // -30,000
        { type: 'CREDIT', amountCents: BigInt(50000) },   // +50,000
        { type: 'DEBIT', amountCents: BigInt(20000) },    // -20,000
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.LIABILITY });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('liability-account-id');

      // Expected: 100,000 - 30,000 + 50,000 - 20,000 = 100,000
      expect(balance).toBe(BigInt(100000));
    });

    it('should handle liability account with only credits', async () => {
      const ledgerEntries = [
        { type: 'CREDIT', amountCents: BigInt(100000) },
        { type: 'CREDIT', amountCents: BigInt(50000) },
        { type: 'CREDIT', amountCents: BigInt(25000) },
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.LIABILITY });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('liability-account-id');

      // Expected: 100,000 + 50,000 + 25,000 = 175,000
      expect(balance).toBe(BigInt(175000));
    });

    it('should handle liability account with only debits (negative balance)', async () => {
      const ledgerEntries = [
        { type: 'DEBIT', amountCents: BigInt(100000) },
        { type: 'DEBIT', amountCents: BigInt(50000) },
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.LIABILITY });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('liability-account-id');

      // Expected: -100,000 - 50,000 = -150,000 (negative liability balance)
      expect(balance).toBe(BigInt(-150000));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return zero balance for account with no ledger entries', async () => {
      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.ASSET });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue([]);

      const balance = await repository.calculateAccountBalance('empty-account-id');

      expect(balance).toBe(BigInt(0));
    });

    it('should throw error for non-existent account', async () => {
      mockPrisma.account.findUnique.mockResolvedValue(null);

      await expect(repository.calculateAccountBalance('non-existent-id'))
        .rejects.toThrow('Account non-existent-id not found');
    });

    it('should handle very large amounts correctly', async () => {
      const ledgerEntries = [
        { type: 'DEBIT', amountCents: BigInt('999999999999999999') },  // Very large amount
        { type: 'CREDIT', amountCents: BigInt('100000000000000000') }, // Large amount
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.ASSET });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('large-amount-account');

      // Expected: 999,999,999,999,999,999 - 100,000,000,000,000,000 = 899,999,999,999,999,999
      expect(balance).toBe(BigInt('899999999999999999'));
    });

    it('should handle zero amount entries', async () => {
      const ledgerEntries = [
        { type: 'DEBIT', amountCents: BigInt(100000) },
        { type: 'CREDIT', amountCents: BigInt(0) },      // Zero amount
        { type: 'DEBIT', amountCents: BigInt(50000) },
        { type: 'CREDIT', amountCents: BigInt(0) },      // Zero amount
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.ASSET });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('zero-amount-account');

      // Expected: 100,000 - 0 + 50,000 - 0 = 150,000
      expect(balance).toBe(BigInt(150000));
    });
  });

  describe('Account Subtype Validation', () => {
    it('should return correct asset subtypes', () => {
      const subtypes = repository.getAccountSubtypes(AccountType.ASSET);
      
      expect(subtypes).toEqual([
        'BANK',
        'CASH',
        'INVESTMENT',
        'CRYPTO',
        'RECEIVABLE',
        'PREPAID',
        'OTHER_ASSET',
      ]);
      expect(subtypes).toHaveLength(7);
    });

    it('should return correct liability subtypes', () => {
      const subtypes = repository.getAccountSubtypes(AccountType.LIABILITY);
      
      expect(subtypes).toEqual([
        'CREDIT_CARD',
        'LOAN',
        'MORTGAGE',
        'PAYABLE',
        'ACCRUED',
        'OTHER_LIABILITY',
      ]);
      expect(subtypes).toHaveLength(6);
    });

    it('should return empty array for invalid account type', () => {
      // @ts-expect-error - Testing invalid input
      const subtypes = repository.getAccountSubtypes('INVALID_TYPE');
      
      expect(subtypes).toEqual([]);
    });
  });

  describe('Balance Integrity Validation', () => {
    it('should validate integrity when calculated and stored balances match', async () => {
      const storedBalance = BigInt(100000);
      const ledgerEntries = [
        { type: 'DEBIT', amountCents: BigInt(100000) },
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ 
        type: AccountType.ASSET, 
        balanceCents: storedBalance 
      });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const isValid = await repository.validateAccountIntegrity('account-id');

      expect(isValid).toBe(true);
    });

    it('should detect integrity issues when balances do not match', async () => {
      const storedBalance = BigInt(50000);  // Stored balance
      const ledgerEntries = [
        { type: 'DEBIT', amountCents: BigInt(100000) }, // Should result in 100,000
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ 
        type: AccountType.ASSET, 
        balanceCents: storedBalance 
      });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const isValid = await repository.validateAccountIntegrity('account-id');

      expect(isValid).toBe(false);
    });

    it('should return false for non-existent account during validation', async () => {
      mockPrisma.account.findUnique.mockResolvedValue(null);

      const isValid = await repository.validateAccountIntegrity('non-existent-id');

      expect(isValid).toBe(false);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical bank account transactions', async () => {
      // Simulate typical bank account: deposits (debits) and withdrawals (credits)
      const ledgerEntries = [
        { type: 'DEBIT', amountCents: BigInt(500000) },   // Initial deposit: 5,000
        { type: 'CREDIT', amountCents: BigInt(150000) },  // Withdrawal: 1,500
        { type: 'DEBIT', amountCents: BigInt(200000) },   // Salary deposit: 2,000
        { type: 'CREDIT', amountCents: BigInt(75000) },   // ATM withdrawal: 750
        { type: 'CREDIT', amountCents: BigInt(300000) },  // Bill payment: 3,000
        { type: 'DEBIT', amountCents: BigInt(100000) },   // Refund: 1,000
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.ASSET });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('bank-account');

      // Expected: 5,000 - 1,500 + 2,000 - 750 - 3,000 + 1,000 = 2,750
      expect(balance).toBe(BigInt(275000));
    });

    it('should handle typical credit card transactions', async () => {
      // Simulate credit card: purchases (credits) and payments (debits)
      const ledgerEntries = [
        { type: 'CREDIT', amountCents: BigInt(100000) },  // Purchase: 1,000
        { type: 'CREDIT', amountCents: BigInt(50000) },   // Purchase: 500
        { type: 'DEBIT', amountCents: BigInt(75000) },    // Payment: 750
        { type: 'CREDIT', amountCents: BigInt(200000) },  // Purchase: 2,000
        { type: 'DEBIT', amountCents: BigInt(100000) },   // Payment: 1,000
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.LIABILITY });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('credit-card');

      // Expected: 1,000 + 500 - 750 + 2,000 - 1,000 = 1,750 (outstanding balance)
      expect(balance).toBe(BigInt(175000));
    });

    it('should handle investment account with gains and losses', async () => {
      const ledgerEntries = [
        { type: 'DEBIT', amountCents: BigInt(1000000) },  // Initial investment: 10,000
        { type: 'DEBIT', amountCents: BigInt(500000) },   // Market gain: 5,000
        { type: 'CREDIT', amountCents: BigInt(200000) },  // Market loss: 2,000
        { type: 'DEBIT', amountCents: BigInt(300000) },   // Additional investment: 3,000
        { type: 'CREDIT', amountCents: BigInt(100000) },  // Fees: 1,000
      ];

      mockPrisma.account.findUnique.mockResolvedValue({ type: AccountType.ASSET });
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const balance = await repository.calculateAccountBalance('investment-account');

      // Expected: 10,000 + 5,000 - 2,000 + 3,000 - 1,000 = 15,000
      expect(balance).toBe(BigInt(1500000));
    });
  });
});
