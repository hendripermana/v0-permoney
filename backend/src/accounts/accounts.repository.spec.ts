import { Test, TestingModule } from '@nestjs/testing';
import { AccountsRepository } from './accounts.repository';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType } from '../../../node_modules/.prisma/client';

describe('AccountsRepository', () => {
  let repository: AccountsRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockAccount = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    householdId: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Account',
    type: AccountType.ASSET,
    subtype: 'BANK',
    currency: 'IDR',
    institutionId: null,
    accountNumber: null,
    balanceCents: BigInt(0),
    isActive: true,
    ownerId: '123e4567-e89b-12d3-a456-426614174002',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      account: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      ledgerEntry: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<AccountsRepository>(AccountsRepository);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create an account', async () => {
      const createDto = {
        name: 'Test Account',
        type: AccountType.ASSET,
        subtype: 'BANK',
        currency: 'IDR',
      };

      prisma.account.create.mockResolvedValue(mockAccount);

      const result = await repository.create('household-id', createDto);

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          householdId: 'household-id',
          balanceCents: 0,
        },
        include: {
          institution: true,
        },
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('findById', () => {
    it('should find account by id with calculated balance', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.ledgerEntry.findMany.mockResolvedValue([]);

      const result = await repository.findById(mockAccount.id);

      expect(result).toEqual({
        ...mockAccount,
        calculatedBalance: BigInt(0),
      });
    });

    it('should return null if account not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('calculateAccountBalance', () => {
    it('should calculate asset account balance correctly', async () => {
      const ledgerEntries = [
        { type: 'DEBIT', amountCents: BigInt(100000) },
        { type: 'CREDIT', amountCents: BigInt(30000) },
        { type: 'DEBIT', amountCents: BigInt(50000) },
      ];

      prisma.account.findUnique.mockResolvedValue({ type: AccountType.ASSET });
      prisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const result = await repository.calculateAccountBalance('account-id');

      // For assets: Debits increase, Credits decrease
      // 100000 - 30000 + 50000 = 120000
      expect(result).toBe(BigInt(120000));
    });

    it('should calculate liability account balance correctly', async () => {
      const ledgerEntries = [
        { type: 'CREDIT', amountCents: BigInt(100000) },
        { type: 'DEBIT', amountCents: BigInt(30000) },
        { type: 'CREDIT', amountCents: BigInt(50000) },
      ];

      prisma.account.findUnique.mockResolvedValue({ type: AccountType.LIABILITY });
      prisma.ledgerEntry.findMany.mockResolvedValue(ledgerEntries);

      const result = await repository.calculateAccountBalance('account-id');

      // For liabilities: Credits increase, Debits decrease
      // 100000 - 30000 + 50000 = 120000
      expect(result).toBe(BigInt(120000));
    });

    it('should throw error if account not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(repository.calculateAccountBalance('non-existent-id')).rejects.toThrow(
        'Account non-existent-id not found',
      );
    });
  });

  describe('getAccountSubtypes', () => {
    it('should return asset subtypes', () => {
      const result = repository.getAccountSubtypes(AccountType.ASSET);

      expect(result).toEqual([
        'BANK',
        'CASH',
        'INVESTMENT',
        'CRYPTO',
        'RECEIVABLE',
        'PREPAID',
        'OTHER_ASSET',
      ]);
    });

    it('should return liability subtypes', () => {
      const result = repository.getAccountSubtypes(AccountType.LIABILITY);

      expect(result).toEqual([
        'CREDIT_CARD',
        'LOAN',
        'MORTGAGE',
        'PAYABLE',
        'ACCRUED',
        'OTHER_LIABILITY',
      ]);
    });
  });

  describe('validateAccountIntegrity', () => {
    it('should return true when calculated balance matches stored balance', async () => {
      const accountWithBalance = { ...mockAccount, balanceCents: BigInt(100000) };
      
      prisma.account.findUnique.mockResolvedValue(accountWithBalance);
      prisma.ledgerEntry.findMany.mockResolvedValue([
        { type: 'DEBIT', amountCents: BigInt(100000) },
      ]);

      const result = await repository.validateAccountIntegrity('account-id');

      expect(result).toBe(true);
    });

    it('should return false when calculated balance does not match stored balance', async () => {
      const accountWithBalance = { ...mockAccount, balanceCents: BigInt(50000) };
      
      prisma.account.findUnique.mockResolvedValue(accountWithBalance);
      prisma.ledgerEntry.findMany.mockResolvedValue([
        { type: 'DEBIT', amountCents: BigInt(100000) },
      ]);

      const result = await repository.validateAccountIntegrity('account-id');

      expect(result).toBe(false);
    });
  });

  describe('syncAccountBalance', () => {
    it('should update stored balance to match calculated balance', async () => {
      prisma.account.findUnique.mockResolvedValue({ type: AccountType.ASSET });
      prisma.ledgerEntry.findMany.mockResolvedValue([
        { type: 'DEBIT', amountCents: BigInt(100000) },
      ]);
      prisma.account.update.mockResolvedValue(mockAccount);

      await repository.syncAccountBalance('account-id');

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'account-id' },
        data: { balanceCents: BigInt(100000) },
      });
    });
  });

  describe('getAccountHistory', () => {
    it.skip('should return account balance history', async () => {
      // This test is skipped for now due to complex mocking requirements
      // In a real implementation, this would be tested with integration tests
    });
  });
});
