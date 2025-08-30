import { Test, TestingModule } from '@nestjs/testing';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HouseholdGuard } from '../household/guards/household.guard';
import { DebtType } from '@prisma/client';
import { CreateDebtDto, CreateDebtPaymentDto } from './dto';

describe('DebtsController', () => {
  let controller: DebtsController;
  let service: DebtsService;

  const mockDebtsService = {
    createDebt: jest.fn(),
    getDebtById: jest.fn(),
    getDebtsByHousehold: jest.fn(),
    updateDebt: jest.fn(),
    deleteDebt: jest.fn(),
    recordPayment: jest.fn(),
    calculatePaymentSchedule: jest.fn(),
    getDebtSummary: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 'user-1',
      currentHouseholdId: 'household-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DebtsController],
      providers: [
        {
          provide: DebtsService,
          useValue: mockDebtsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(HouseholdGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DebtsController>(DebtsController);
    service = module.get<DebtsService>(DebtsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDebt', () => {
    it('should create a debt', async () => {
      const createDebtDto: CreateDebtDto = {
        type: DebtType.PERSONAL,
        name: 'Personal Loan',
        creditor: 'John Doe',
        principalAmount: 1000,
        startDate: '2024-01-01',
      };

      const expectedDebt = {
        id: 'debt-1',
        ...createDebtDto,
        householdId: 'household-1',
      };

      mockDebtsService.createDebt.mockResolvedValue(expectedDebt);

      const result = await controller.createDebt(createDebtDto, mockRequest);

      expect(mockDebtsService.createDebt).toHaveBeenCalledWith(
        'household-1',
        createDebtDto,
        'user-1'
      );
      expect(result).toEqual(expectedDebt);
    });
  });

  describe('getDebts', () => {
    it('should return debts for household', async () => {
      const filters = { type: DebtType.PERSONAL };
      const expectedDebts = [
        {
          id: 'debt-1',
          name: 'Personal Loan',
          type: DebtType.PERSONAL,
          payments: [],
        },
      ];

      mockDebtsService.getDebtsByHousehold.mockResolvedValue(expectedDebts);

      const result = await controller.getDebts(filters, mockRequest);

      expect(mockDebtsService.getDebtsByHousehold).toHaveBeenCalledWith(
        'household-1',
        filters
      );
      expect(result).toEqual(expectedDebts);
    });
  });

  describe('getDebtSummary', () => {
    it('should return debt summary', async () => {
      const expectedSummary = {
        totalDebt: 5000,
        currency: 'IDR',
        byType: [],
        upcomingPayments: {
          dueToday: [],
          dueThisWeek: [],
          dueThisMonth: [],
          overdue: [],
        },
        payoffProjection: {
          totalInterestRemaining: 0,
          averagePayoffMonths: 0,
        },
      };

      mockDebtsService.getDebtSummary.mockResolvedValue(expectedSummary);

      const result = await controller.getDebtSummary(mockRequest);

      expect(mockDebtsService.getDebtSummary).toHaveBeenCalledWith(
        'household-1'
      );
      expect(result).toEqual(expectedSummary);
    });
  });

  describe('getDebt', () => {
    it('should return specific debt', async () => {
      const debtId = 'debt-1';
      const expectedDebt = {
        id: debtId,
        name: 'Test Debt',
        payments: [],
      };

      mockDebtsService.getDebtById.mockResolvedValue(expectedDebt);

      const result = await controller.getDebt(debtId, mockRequest);

      expect(mockDebtsService.getDebtById).toHaveBeenCalledWith(
        debtId,
        'household-1'
      );
      expect(result).toEqual(expectedDebt);
    });
  });

  describe('getPaymentSchedule', () => {
    it('should return payment schedule', async () => {
      const debtId = 'debt-1';
      const expectedSchedule = {
        debtId,
        debtName: 'Test Debt',
        totalPayments: 12,
        schedule: [],
        summary: {
          totalInterest: 0,
          totalPrincipal: 1000,
          totalAmount: 1000,
          remainingBalance: 500,
        },
      };

      mockDebtsService.calculatePaymentSchedule.mockResolvedValue(
        expectedSchedule
      );

      const result = await controller.getPaymentSchedule(debtId, mockRequest);

      expect(mockDebtsService.calculatePaymentSchedule).toHaveBeenCalledWith(
        debtId,
        'household-1'
      );
      expect(result).toEqual(expectedSchedule);
    });
  });

  describe('updateDebt', () => {
    it('should update debt', async () => {
      const debtId = 'debt-1';
      const updateDto = { name: 'Updated Debt Name' };
      const expectedDebt = {
        id: debtId,
        name: 'Updated Debt Name',
      };

      mockDebtsService.updateDebt.mockResolvedValue(expectedDebt);

      const result = await controller.updateDebt(
        debtId,
        updateDto,
        mockRequest
      );

      expect(mockDebtsService.updateDebt).toHaveBeenCalledWith(
        debtId,
        'household-1',
        updateDto
      );
      expect(result).toEqual(expectedDebt);
    });
  });

  describe('deleteDebt', () => {
    it('should delete debt', async () => {
      const debtId = 'debt-1';

      mockDebtsService.deleteDebt.mockResolvedValue(undefined);

      const result = await controller.deleteDebt(debtId, mockRequest);

      expect(mockDebtsService.deleteDebt).toHaveBeenCalledWith(
        debtId,
        'household-1'
      );
      expect(result).toEqual({ message: 'Debt deleted successfully' });
    });
  });

  describe('recordPayment', () => {
    it('should record payment', async () => {
      const debtId = 'debt-1';
      const paymentDto: CreateDebtPaymentDto = {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 450,
        interestAmount: 50,
      };

      const expectedPayment = {
        id: 'payment-1',
        debtId,
        amountCents: BigInt(50000),
      };

      mockDebtsService.recordPayment.mockResolvedValue(expectedPayment);

      const result = await controller.recordPayment(
        debtId,
        paymentDto,
        mockRequest
      );

      expect(mockDebtsService.recordPayment).toHaveBeenCalledWith(
        debtId,
        'household-1',
        paymentDto
      );
      expect(result).toEqual(expectedPayment);
    });
  });
});
