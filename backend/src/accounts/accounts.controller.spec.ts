import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HouseholdAccessGuard } from '../household/guards/household-access.guard';
import { AccountType } from '@prisma/client';

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: jest.Mocked<AccountsService>;

  const mockUser = {
    sub: 'user-id',
    email: 'test@example.com',
    householdId: 'household-id',
  };

  const mockAccount = {
    id: 'account-id',
    householdId: 'household-id',
    name: 'Test Account',
    type: AccountType.ASSET,
    subtype: 'BANK',
    currency: 'IDR',
    institutionId: null,
    accountNumber: null,
    balanceCents: BigInt(0),
    isActive: true,
    ownerId: 'user-id',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    calculatedBalance: BigInt(100000),
    institution: null,
  };

  beforeEach(async () => {
    const mockService = {
      createAccount: jest.fn(),
      getAccountById: jest.fn(),
      getAccountsByHousehold: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
      getAccountBalance: jest.fn(),
      getAccountHistory: jest.fn(),
      getNetWorthSummary: jest.fn(),
      getAccountSubtypes: jest.fn(),
      validateAccountIntegrity: jest.fn(),
      syncAccountBalance: jest.fn(),
      getAccountsGrouped: jest.fn(),
      getAccountStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(HouseholdAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AccountsController>(AccountsController);
    service = module.get(AccountsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAccount', () => {
    it('should create an account', async () => {
      const createDto = {
        name: 'Test Account',
        type: AccountType.ASSET,
        subtype: 'BANK',
        currency: 'IDR',
      };

      service.createAccount.mockResolvedValue(mockAccount);

      const result = await controller.createAccount(createDto, mockUser);

      expect(service.createAccount).toHaveBeenCalledWith(
        mockUser.householdId,
        createDto,
        mockUser.sub,
      );
      expect(result).toEqual(mockAccount);
    });
  });

  describe('getAccounts', () => {
    it('should get accounts with filters', async () => {
      const filters = { type: AccountType.ASSET };
      const accounts = [mockAccount];

      service.getAccountsByHousehold.mockResolvedValue(accounts);

      const result = await controller.getAccounts(filters, mockUser);

      expect(service.getAccountsByHousehold).toHaveBeenCalledWith(
        mockUser.householdId,
        filters,
        mockUser.sub,
      );
      expect(result).toEqual(accounts);
    });
  });

  describe('getAccountsGrouped', () => {
    it('should get grouped accounts', async () => {
      const filters = {};
      const groupedAccounts = {
        assets: { BANK: [mockAccount] },
        liabilities: {},
      };

      service.getAccountsGrouped.mockResolvedValue(groupedAccounts);

      const result = await controller.getAccountsGrouped(filters, mockUser);

      expect(service.getAccountsGrouped).toHaveBeenCalledWith(
        mockUser.householdId,
        filters,
        mockUser.sub,
      );
      expect(result).toEqual(groupedAccounts);
    });
  });

  describe('getAccountStats', () => {
    it('should get account statistics', async () => {
      const stats = {
        totalAccounts: 5,
        activeAccounts: 4,
        assetAccounts: 3,
        liabilityAccounts: 2,
        currenciesUsed: ['IDR', 'USD'],
      };

      service.getAccountStats.mockResolvedValue(stats);

      const result = await controller.getAccountStats(mockUser);

      expect(service.getAccountStats).toHaveBeenCalledWith(mockUser.householdId);
      expect(result).toEqual(stats);
    });
  });

  describe('getNetWorth', () => {
    it('should get net worth summary', async () => {
      const filters = {};
      const netWorth = {
        totalAssets: BigInt(100000),
        totalLiabilities: BigInt(50000),
        netWorth: BigInt(50000),
        assetsByType: { BANK: BigInt(100000) },
        liabilitiesByType: { CREDIT_CARD: BigInt(50000) },
        currency: 'IDR',
      };

      service.getNetWorthSummary.mockResolvedValue(netWorth);

      const result = await controller.getNetWorth('IDR', filters, mockUser);

      expect(service.getNetWorthSummary).toHaveBeenCalledWith(
        mockUser.householdId,
        'IDR',
        filters,
      );
      expect(result).toEqual(netWorth);
    });
  });

  describe('getAccountSubtypes', () => {
    it('should get account subtypes', async () => {
      const subtypes = ['BANK', 'CASH', 'INVESTMENT'];

      service.getAccountSubtypes.mockResolvedValue(subtypes);

      const result = await controller.getAccountSubtypes(AccountType.ASSET);

      expect(service.getAccountSubtypes).toHaveBeenCalledWith(AccountType.ASSET);
      expect(result).toEqual(subtypes);
    });
  });

  describe('getAccount', () => {
    it('should get account by id', async () => {
      service.getAccountById.mockResolvedValue(mockAccount);

      const result = await controller.getAccount('account-id', mockUser);

      expect(service.getAccountById).toHaveBeenCalledWith('account-id', mockUser.householdId);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('getAccountBalance', () => {
    it('should get account balance', async () => {
      const balance = BigInt(100000);

      service.getAccountBalance.mockResolvedValue(balance);

      const result = await controller.getAccountBalance('account-id', mockUser);

      expect(service.getAccountBalance).toHaveBeenCalledWith('account-id', mockUser.householdId);
      expect(result).toEqual({ balance: '100000' });
    });
  });

  describe('getAccountHistory', () => {
    it('should get account history with default dates', async () => {
      const history = [
        { date: new Date('2024-01-15'), balance: BigInt(100000) },
        { date: new Date('2024-01-20'), balance: BigInt(120000) },
      ];

      service.getAccountHistory.mockResolvedValue(history);

      const result = await controller.getAccountHistory('account-id', '', '', mockUser);

      expect(service.getAccountHistory).toHaveBeenCalledWith(
        'account-id',
        mockUser.householdId,
        expect.any(Date),
        expect.any(Date),
      );
      expect(result).toEqual([
        { date: new Date('2024-01-15'), balance: '100000' },
        { date: new Date('2024-01-20'), balance: '120000' },
      ]);
    });

    it('should get account history with custom dates', async () => {
      const history = [
        { date: new Date('2024-01-15'), balance: BigInt(100000) },
      ];

      service.getAccountHistory.mockResolvedValue(history);

      const result = await controller.getAccountHistory(
        'account-id',
        '2024-01-01',
        '2024-01-31',
        mockUser,
      );

      expect(service.getAccountHistory).toHaveBeenCalledWith(
        'account-id',
        mockUser.householdId,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
      expect(result).toEqual([
        { date: new Date('2024-01-15'), balance: '100000' },
      ]);
    });
  });

  describe('updateAccount', () => {
    it('should update account', async () => {
      const updateDto = { name: 'Updated Account' };
      const updatedAccount = { ...mockAccount, name: 'Updated Account' };

      service.updateAccount.mockResolvedValue(updatedAccount);

      const result = await controller.updateAccount('account-id', updateDto, mockUser);

      expect(service.updateAccount).toHaveBeenCalledWith(
        'account-id',
        mockUser.householdId,
        updateDto,
      );
      expect(result).toEqual(updatedAccount);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account', async () => {
      const deletedAccount = { ...mockAccount, isActive: false };

      service.deleteAccount.mockResolvedValue(deletedAccount);

      const result = await controller.deleteAccount('account-id', mockUser);

      expect(service.deleteAccount).toHaveBeenCalledWith('account-id', mockUser.householdId);
      expect(result).toEqual(deletedAccount);
    });
  });

  describe('validateAccountIntegrity', () => {
    it('should validate account integrity', async () => {
      service.validateAccountIntegrity.mockResolvedValue(true);

      const result = await controller.validateAccountIntegrity('account-id', mockUser);

      expect(service.validateAccountIntegrity).toHaveBeenCalledWith(
        'account-id',
        mockUser.householdId,
      );
      expect(result).toEqual({ isValid: true });
    });
  });

  describe('syncAccountBalance', () => {
    it('should sync account balance', async () => {
      service.syncAccountBalance.mockResolvedValue();

      const result = await controller.syncAccountBalance('account-id', mockUser);

      expect(service.syncAccountBalance).toHaveBeenCalledWith('account-id', mockUser.householdId);
      expect(result).toEqual({ message: 'Account balance synchronized successfully' });
    });
  });
});
