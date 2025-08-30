import { Test, TestingModule } from '@nestjs/testing';
import { ZakatCalculationService } from './zakat-calculation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ZakatAssetType } from '../types/islamic-finance.types';

describe('ZakatCalculationService', () => {
  let service: ZakatCalculationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    household: {
      findUnique: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    zakatCalculation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    zakatPayment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZakatCalculationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ZakatCalculationService>(ZakatCalculationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateZakat', () => {
    it('should calculate zakat for eligible assets', async () => {
      const householdId = 'household-1';
      const mockHousehold = {
        id: householdId,
        baseCurrency: 'IDR',
      };

      const mockAccounts = [
        {
          id: 'account-1',
          name: 'Savings Account',
          type: 'ASSET',
          subtype: 'savings',
          currency: 'IDR',
          balanceCents: 10000000n, // 100,000 IDR
          createdAt: new Date('2023-01-01'),
          shariaCompliance: {
            complianceStatus: 'COMPLIANT',
          },
        },
        {
          id: 'account-2',
          name: 'Investment Account',
          type: 'ASSET',
          subtype: 'investment',
          currency: 'IDR',
          balanceCents: 5000000n, // 50,000 IDR
          createdAt: new Date('2023-01-01'),
          shariaCompliance: {
            complianceStatus: 'COMPLIANT',
          },
        },
      ];

      const mockZakatCalculation = {
        id: 'calc-1',
        householdId,
        calculationDate: new Date(),
        hijriYear: 1445,
        nisabThresholdCents: 8500000n,
        totalZakatableAssetsCents: 15000000n,
        zakatAmountCents: 375000n,
        currency: 'IDR',
        isZakatDue: true,
        nextCalculationDate: new Date('2025-01-01'),
        assetBreakdown: [
          {
            id: 'breakdown-1',
            assetType: ZakatAssetType.SAVINGS,
            accountId: 'account-1',
            accountName: 'Savings Account',
            amountCents: 10000000n,
            currency: 'IDR',
            zakatRate: 0.025,
            zakatAmountCents: 250000n,
            haulCompleted: true,
            haulStartDate: new Date('2023-01-01'),
          },
          {
            id: 'breakdown-2',
            assetType: ZakatAssetType.INVESTMENT,
            accountId: 'account-2',
            accountName: 'Investment Account',
            amountCents: 5000000n,
            currency: 'IDR',
            zakatRate: 0.025,
            zakatAmountCents: 125000n,
            haulCompleted: true,
            haulStartDate: new Date('2023-01-01'),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.household.findUnique.mockResolvedValue(mockHousehold);
      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);
      mockPrismaService.zakatCalculation.create.mockResolvedValue(mockZakatCalculation);

      const result = await service.calculateZakat({ householdId });

      expect(result).toBeDefined();
      expect(result.householdId).toBe(householdId);
      expect(result.isZakatDue).toBe(true);
      expect(result.zakatAmount.amount).toBe(3750); // 375000 cents = 3750 IDR
      expect(result.assetBreakdown).toHaveLength(2);
      expect(mockPrismaService.zakatCalculation.create).toHaveBeenCalled();
    });

    it('should exclude non-compliant accounts from zakat calculation', async () => {
      const householdId = 'household-1';
      const mockHousehold = {
        id: householdId,
        baseCurrency: 'IDR',
      };

      const mockAccounts = [
        {
          id: 'account-1',
          name: 'Conventional Savings',
          type: 'ASSET',
          subtype: 'savings',
          currency: 'IDR',
          balanceCents: 10000000n,
          createdAt: new Date('2023-01-01'),
          shariaCompliance: {
            complianceStatus: 'NON_COMPLIANT',
          },
        },
        {
          id: 'account-2',
          name: 'Islamic Savings',
          type: 'ASSET',
          subtype: 'savings',
          currency: 'IDR',
          balanceCents: 5000000n,
          createdAt: new Date('2023-01-01'),
          shariaCompliance: {
            complianceStatus: 'COMPLIANT',
          },
        },
      ];

      mockPrismaService.household.findUnique.mockResolvedValue(mockHousehold);
      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);

      // Mock the create method to return a calculation with only compliant accounts
      const mockZakatCalculation = {
        id: 'calc-1',
        householdId,
        calculationDate: new Date(),
        hijriYear: 1445,
        nisabThresholdCents: 8500000n,
        totalZakatableAssetsCents: 5000000n,
        zakatAmountCents: 125000n,
        currency: 'IDR',
        isZakatDue: false, // Below nisab threshold
        nextCalculationDate: new Date('2025-01-01'),
        assetBreakdown: [
          {
            id: 'breakdown-1',
            assetType: ZakatAssetType.SAVINGS,
            accountId: 'account-2',
            accountName: 'Islamic Savings',
            amountCents: 5000000n,
            currency: 'IDR',
            zakatRate: 0.025,
            zakatAmountCents: 125000n,
            haulCompleted: true,
            haulStartDate: new Date('2023-01-01'),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.zakatCalculation.create.mockResolvedValue(mockZakatCalculation);

      const result = await service.calculateZakat({ householdId });

      expect(result.assetBreakdown).toHaveLength(1);
      expect(result.assetBreakdown[0].accountName).toBe('Islamic Savings');
      expect(result.isZakatDue).toBe(false);
    });

    it('should handle accounts without completed haul period', async () => {
      const householdId = 'household-1';
      const mockHousehold = {
        id: householdId,
        baseCurrency: 'IDR',
      };

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 100); // Account created 100 days ago

      const mockAccounts = [
        {
          id: 'account-1',
          name: 'New Savings Account',
          type: 'ASSET',
          subtype: 'savings',
          currency: 'IDR',
          balanceCents: 10000000n,
          createdAt: recentDate,
          shariaCompliance: {
            complianceStatus: 'COMPLIANT',
          },
        },
      ];

      mockPrismaService.household.findUnique.mockResolvedValue(mockHousehold);
      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccounts[0]);

      const mockZakatCalculation = {
        id: 'calc-1',
        householdId,
        calculationDate: new Date(),
        hijriYear: 1445,
        nisabThresholdCents: 8500000n,
        totalZakatableAssetsCents: 0n,
        zakatAmountCents: 0n,
        currency: 'IDR',
        isZakatDue: false,
        nextCalculationDate: new Date('2025-01-01'),
        assetBreakdown: [
          {
            id: 'breakdown-1',
            assetType: ZakatAssetType.SAVINGS,
            accountId: 'account-1',
            accountName: 'New Savings Account',
            amountCents: 10000000n,
            currency: 'IDR',
            zakatRate: 0.025,
            zakatAmountCents: 0n,
            haulCompleted: false,
            haulStartDate: recentDate,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.zakatCalculation.create.mockResolvedValue(mockZakatCalculation);

      const result = await service.calculateZakat({ householdId });

      expect(result.assetBreakdown[0].haulCompleted).toBe(false);
      expect(result.assetBreakdown[0].zakatAmount.amount).toBe(0);
      expect(result.isZakatDue).toBe(false);
    });
  });

  describe('recordZakatPayment', () => {
    it('should record a zakat payment', async () => {
      const paymentDto = {
        householdId: 'household-1',
        amount: 1000,
        currency: 'IDR',
        paymentDate: '2024-01-01',
        hijriDate: '1/5/1445 AH',
        transactionId: 'transaction-1',
        notes: 'Annual zakat payment',
      };

      mockPrismaService.zakatPayment.create.mockResolvedValue({
        id: 'payment-1',
        ...paymentDto,
        amountCents: 100000n,
      });

      await service.recordZakatPayment(paymentDto);

      expect(mockPrismaService.zakatPayment.create).toHaveBeenCalledWith({
        data: {
          householdId: paymentDto.householdId,
          amountCents: 100000, // 1000 * 100
          currency: paymentDto.currency,
          paymentDate: new Date(paymentDto.paymentDate),
          hijriDate: paymentDto.hijriDate,
          transactionId: paymentDto.transactionId,
          notes: paymentDto.notes,
        },
      });
    });
  });

  describe('getZakatCalculations', () => {
    it('should return zakat calculations for a household', async () => {
      const householdId = 'household-1';
      const mockCalculations = [
        {
          id: 'calc-1',
          householdId,
          calculationDate: new Date(),
          hijriYear: 1445,
          nisabThresholdCents: 8500000n,
          totalZakatableAssetsCents: 15000000n,
          zakatAmountCents: 375000n,
          currency: 'IDR',
          isZakatDue: true,
          nextCalculationDate: new Date('2025-01-01'),
          assetBreakdown: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.zakatCalculation.findMany.mockResolvedValue(mockCalculations);

      const result = await service.getZakatCalculations(householdId);

      expect(result).toHaveLength(1);
      expect(result[0].householdId).toBe(householdId);
      expect(mockPrismaService.zakatCalculation.findMany).toHaveBeenCalledWith({
        where: { householdId },
        include: { assetBreakdown: true },
        orderBy: { calculationDate: 'desc' },
        take: 10,
      });
    });
  });

  describe('getLatestZakatCalculation', () => {
    it('should return the latest zakat calculation', async () => {
      const householdId = 'household-1';
      const mockCalculation = {
        id: 'calc-1',
        householdId,
        calculationDate: new Date(),
        hijriYear: 1445,
        nisabThresholdCents: 8500000n,
        totalZakatableAssetsCents: 15000000n,
        zakatAmountCents: 375000n,
        currency: 'IDR',
        isZakatDue: true,
        nextCalculationDate: new Date('2025-01-01'),
        assetBreakdown: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.zakatCalculation.findFirst.mockResolvedValue(mockCalculation);

      const result = await service.getLatestZakatCalculation(householdId);

      expect(result).toBeDefined();
      expect(result?.householdId).toBe(householdId);
      expect(mockPrismaService.zakatCalculation.findFirst).toHaveBeenCalledWith({
        where: { householdId },
        include: { assetBreakdown: true },
        orderBy: { calculationDate: 'desc' },
      });
    });

    it('should return null if no calculations exist', async () => {
      const householdId = 'household-1';

      mockPrismaService.zakatCalculation.findFirst.mockResolvedValue(null);

      const result = await service.getLatestZakatCalculation(householdId);

      expect(result).toBeNull();
    });
  });
});
