import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { AccountsRepository } from './accounts.repository';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AccountType } from '../../../node_modules/.prisma/client';

describe('AccountsService', () => {
  let service: AccountsService;
  let repository: jest.Mocked<AccountsRepository>;

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
    calculatedBalance: BigInt(100000),
    institution: null,
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByHousehold: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      calculateAccountBalance: jest.fn(),
      getAccountHistory: jest.fn(),
      getAccountSubtypes: jest.fn(),
      validateAccountIntegrity: jest.fn(),
      syncAccountBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: AccountsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repository = module.get(AccountsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    it('should create an account successfully', async () => {
      const createDto = {
        name: 'Test Account',
        type: AccountType.ASSET,
        subtype: 'BANK',
        currency: 'IDR',
      };

      repository.getAccountSubtypes.mockReturnValue(['BANK', 'CASH', 'INVESTMENT']);
      repository.create.mockResolvedValue(mockAccount);

      const result = await service.createAccount('household-id', createDto, 'user-id');

      expect(repository.create).toHaveBeenCalledWith('household-id', {
        ...createDto,
        ownerId: 'user-id',
      });
      expect(result).toEqual(mockAccount);
    });

    it('should throw BadRequestException for invalid subtype', async () => {
      const createDto = {
        name: 'Test Account',
        type: AccountType.ASSET,
        subtype: 'INVALID_SUBTYPE',
        currency: 'IDR',
      };

      repository.getAccountSubtypes.mockReturnValue(['BANK', 'CASH', 'INVESTMENT']);

      await expect(
        service.createAccount('household-id', createDto, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAccountById', () => {
    it('should return account if found and belongs to household', async () => {
      repository.findById.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(mockAccount.id, mockAccount.householdId);

      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException if account not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.getAccountById('non-existent-id', 'household-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if account belongs to different household', async () => {
      repository.findById.mockResolvedValue(mockAccount);

      await expect(
        service.getAccountById(mockAccount.id, 'different-household-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAccountsByHousehold', () => {
    it('should return accounts for household', async () => {
      const accounts = [mockAccount];
      repository.findByHousehold.mockResolvedValue(accounts);

      const result = await service.getAccountsByHousehold('household-id', {});

      expect(result).toEqual(accounts);
      expect(repository.findByHousehold).toHaveBeenCalledWith('household-id', {}, undefined);
    });
  });

  describe('updateAccount', () => {
    it('should update account successfully', async () => {
      const updateDto = { name: 'Updated Account' };
      repository.findById.mockResolvedValue(mockAccount);
      repository.update.mockResolvedValue({ ...mockAccount, ...updateDto });

      const result = await service.updateAccount(mockAccount.id, mockAccount.householdId, updateDto);

      expect(repository.update).toHaveBeenCalledWith(mockAccount.id, updateDto);
      expect(result.name).toBe('Updated Account');
    });

    it('should validate subtype when updating type and subtype', async () => {
      const updateDto = { type: AccountType.ASSET, subtype: 'INVALID_SUBTYPE' };
      repository.findById.mockResolvedValue(mockAccount);
      repository.getAccountSubtypes.mockReturnValue(['BANK', 'CASH', 'INVESTMENT']);

      await expect(
        service.updateAccount(mockAccount.id, mockAccount.householdId, updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAccountBalance', () => {
    it('should return calculated balance', async () => {
      const balance = BigInt(100000);
      repository.findById.mockResolvedValue(mockAccount);
      repository.calculateAccountBalance.mockResolvedValue(balance);

      const result = await service.getAccountBalance(mockAccount.id, mockAccount.householdId);

      expect(result).toBe(balance);
    });
  });

  describe('getNetWorthSummary', () => {
    it('should calculate net worth correctly', async () => {
      const assetAccount = { ...mockAccount, type: AccountType.ASSET, calculatedBalance: BigInt(100000) };
      const liabilityAccount = { 
        ...mockAccount, 
        id: 'liability-id',
        type: AccountType.LIABILITY, 
        subtype: 'CREDIT_CARD',
        calculatedBalance: BigInt(50000) 
      };

      repository.findByHousehold.mockResolvedValue([assetAccount, liabilityAccount]);

      const result = await service.getNetWorthSummary('household-id');

      expect(result.totalAssets).toBe(BigInt(100000));
      expect(result.totalLiabilities).toBe(BigInt(50000));
      expect(result.netWorth).toBe(BigInt(50000));
      expect(result.assetsByType.BANK).toBe(BigInt(100000));
      expect(result.liabilitiesByType.CREDIT_CARD).toBe(BigInt(50000));
    });
  });

  describe('getAccountSubtypes', () => {
    it('should return asset subtypes', async () => {
      repository.getAccountSubtypes.mockReturnValue(['BANK', 'CASH', 'INVESTMENT']);

      const result = await service.getAccountSubtypes(AccountType.ASSET);

      expect(result).toEqual(['BANK', 'CASH', 'INVESTMENT']);
    });
  });

  describe('validateAccountIntegrity', () => {
    it('should validate account integrity', async () => {
      repository.findById.mockResolvedValue(mockAccount);
      repository.validateAccountIntegrity.mockResolvedValue(true);

      const result = await service.validateAccountIntegrity(mockAccount.id, mockAccount.householdId);

      expect(result).toBe(true);
    });
  });

  describe('getAccountsGrouped', () => {
    it('should group accounts by type and subtype', async () => {
      const assetAccount = { ...mockAccount, type: AccountType.ASSET, subtype: 'BANK' };
      const liabilityAccount = { 
        ...mockAccount, 
        id: 'liability-id',
        type: AccountType.LIABILITY, 
        subtype: 'CREDIT_CARD' 
      };

      repository.findByHousehold.mockResolvedValue([assetAccount, liabilityAccount]);

      const result = await service.getAccountsGrouped('household-id');

      expect(result.assets.BANK).toEqual([assetAccount]);
      expect(result.liabilities.CREDIT_CARD).toEqual([liabilityAccount]);
    });
  });

  describe('getAccountStats', () => {
    it('should return account statistics', async () => {
      const accounts = [
        { ...mockAccount, type: AccountType.ASSET, currency: 'IDR', isActive: true },
        { ...mockAccount, id: 'account-2', type: AccountType.LIABILITY, currency: 'USD', isActive: true },
        { ...mockAccount, id: 'account-3', type: AccountType.ASSET, currency: 'IDR', isActive: false },
      ];

      repository.findByHousehold.mockResolvedValue(accounts);

      const result = await service.getAccountStats('household-id');

      expect(result.totalAccounts).toBe(3);
      expect(result.activeAccounts).toBe(2);
      expect(result.assetAccounts).toBe(2);
      expect(result.liabilityAccounts).toBe(1);
      expect(result.currenciesUsed).toEqual(['IDR', 'USD']);
    });
  });
});
