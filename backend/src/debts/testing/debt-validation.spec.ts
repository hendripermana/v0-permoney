import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateDebtDto, DebtType } from '../dto/create-debt.dto';
import { CreateDebtPaymentDto } from '../dto/create-debt-payment.dto';
import { DebtFiltersDto } from '../dto/debt-filters.dto';

describe('Debt Validation Tests', () => {
  describe('CreateDebtDto Validation', () => {
    describe('Personal Debt Validation', () => {
      it('should validate valid personal debt', async () => {
        const dto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: 'Loan from friend',
          creditor: 'John Doe',
          principalAmount: 1000,
          currency: 'IDR',
          startDate: '2024-01-01',
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should reject personal debt with interest rate', async () => {
        const dto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: 'Invalid personal loan',
          creditor: 'Someone',
          principalAmount: 1000,
          interestRate: 0.1,
          startDate: '2024-01-01',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject personal debt with margin rate', async () => {
        const dto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: 'Invalid personal loan',
          creditor: 'Someone',
          principalAmount: 1000,
          marginRate: 0.05,
          startDate: '2024-01-01',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('Conventional Debt Validation', () => {
      it('should validate valid conventional debt', async () => {
        const dto = plainToClass(CreateDebtDto, {
          type: DebtType.CONVENTIONAL,
          name: 'Credit Card',
          creditor: 'Bank ABC',
          principalAmount: 5000,
          interestRate: 0.18,
          startDate: '2024-01-01',
          maturityDate: '2026-01-01',
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should require interest rate for conventional debt', async () => {
        const dto = plainToClass(CreateDebtDto, {
          type: DebtType.CONVENTIONAL,
          name: 'Credit Card',
          creditor: 'Bank ABC',
          principalAmount: 5000,
          startDate: '2024-01-01',
          maturityDate: '2026-01-01',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'interestRate')).toBe(true);
      });

      it('should reject conventional debt with margin rate', async () => {
        const dto = plainToClass(CreateDebtDto, {
          type: DebtType.CONVENTIONAL,
          name: 'Credit Card',
          creditor: 'Bank ABC',
          principalAmount: 5000,
          interestRate: 0.18,
          marginRate: 0.05,
          startDate: '2024-01-01',
          maturityDate: '2026-01-01',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should validate interest rate bounds', async () => {
        // Test negative interest rate
        const negativeDto = plainToClass(CreateDebtDto, {
          type: DebtType.CONVENTIONAL,
          name: 'Credit Card',
          creditor: 'Bank ABC',
          principalAmount: 5000,
          interestRate: -0.1,
          startDate: '2024-01-01',
          maturityDate: '2026-01-01',
        });

        const negativeErrors = await validate(negativeDto);
        expect(negativeErrors.length).toBeGreaterThan(0);

        // Test excessive interest rate
        const excessiveDto = plainToClass(CreateDebtDto, {
          type: DebtType.CONVENTIONAL,
          name: 'Credit Card',
          creditor: 'Bank ABC',
          principalAmount: 5000,
          interestRate: 1.5, // 150%
          startDate: '2024-01-01',
          maturityDate: '2026-01-01',
        });

        const excessiveErrors = await validate(excessiveDto);
        expect(excessiveErrors.length).toBeGreaterThan(0);
      });
    });

    describe('Islamic Debt Validation', () => {
      it('should validate valid Islamic debt', async () => {
        const dto = plainToClass(CreateDebtDto, {
          type: DebtType.ISLAMIC,
          name: 'Murabahah Financing',
          creditor: 'Islamic Bank',
          principalAmount: 100000,
          marginRate: 0.06,
          startDate: '2024-01-01',
          maturityDate: '2044-01-01',
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should require margin rate for Islamic debt', async () => {
        const dto = plainToClass(CreateDebtDto, {
          type: DebtType.ISLAMIC,
          name: 'Murabahah Financing',
          creditor: 'Islamic Bank',
          principalAmount: 100000,
          startDate: '2024-01-01',
          maturityDate: '2044-01-01',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'marginRate')).toBe(true);
      });

      it('should reject Islamic debt with interest rate', async () => {
        const dto = plainToClass(CreateDebtDto, {
          type: DebtType.ISLAMIC,
          name: 'Murabahah Financing',
          creditor: 'Islamic Bank',
          principalAmount: 100000,
          marginRate: 0.06,
          interestRate: 0.05,
          startDate: '2024-01-01',
          maturityDate: '2044-01-01',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should validate margin rate bounds', async () => {
        // Test negative margin rate
        const negativeDto = plainToClass(CreateDebtDto, {
          type: DebtType.ISLAMIC,
          name: 'Murabahah Financing',
          creditor: 'Islamic Bank',
          principalAmount: 100000,
          marginRate: -0.01,
          startDate: '2024-01-01',
          maturityDate: '2044-01-01',
        });

        const negativeErrors = await validate(negativeDto);
        expect(negativeErrors.length).toBeGreaterThan(0);

        // Test excessive margin rate
        const excessiveDto = plainToClass(CreateDebtDto, {
          type: DebtType.ISLAMIC,
          name: 'Murabahah Financing',
          creditor: 'Islamic Bank',
          principalAmount: 100000,
          marginRate: 1.5, // 150%
          startDate: '2024-01-01',
          maturityDate: '2044-01-01',
        });

        const excessiveErrors = await validate(excessiveDto);
        expect(excessiveErrors.length).toBeGreaterThan(0);
      });
    });

    describe('Common Field Validation', () => {
      it('should validate required fields', async () => {
        const dto = plainToClass(CreateDebtDto, {});
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'type')).toBe(true);
        expect(errors.some(e => e.property === 'name')).toBe(true);
        expect(errors.some(e => e.property === 'creditor')).toBe(true);
        expect(errors.some(e => e.property === 'principalAmount')).toBe(true);
        expect(errors.some(e => e.property === 'startDate')).toBe(true);
      });

      it('should validate name length constraints', async () => {
        // Test empty name
        const emptyNameDto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: '',
          creditor: 'John Doe',
          principalAmount: 1000,
          startDate: '2024-01-01',
        });

        const emptyErrors = await validate(emptyNameDto);
        expect(emptyErrors.length).toBeGreaterThan(0);

        // Test excessively long name
        const longNameDto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: 'a'.repeat(256),
          creditor: 'John Doe',
          principalAmount: 1000,
          startDate: '2024-01-01',
        });

        const longErrors = await validate(longNameDto);
        expect(longErrors.length).toBeGreaterThan(0);
      });

      it('should validate principal amount constraints', async () => {
        // Test zero amount
        const zeroDto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: 'Test Debt',
          creditor: 'John Doe',
          principalAmount: 0,
          startDate: '2024-01-01',
        });

        const zeroErrors = await validate(zeroDto);
        expect(zeroErrors.length).toBeGreaterThan(0);

        // Test negative amount
        const negativeDto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: 'Test Debt',
          creditor: 'John Doe',
          principalAmount: -1000,
          startDate: '2024-01-01',
        });

        const negativeErrors = await validate(negativeDto);
        expect(negativeErrors.length).toBeGreaterThan(0);

        // Test excessive amount
        const excessiveDto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: 'Test Debt',
          creditor: 'John Doe',
          principalAmount: 1000000000, // 1 billion
          startDate: '2024-01-01',
        });

        const excessiveErrors = await validate(excessiveDto);
        expect(excessiveErrors.length).toBeGreaterThan(0);
      });

      it('should validate currency format', async () => {
        // Test invalid currency format
        const invalidCurrencyDto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: 'Test Debt',
          creditor: 'John Doe',
          principalAmount: 1000,
          currency: 'invalid',
          startDate: '2024-01-01',
        });

        const errors = await validate(invalidCurrencyDto);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should validate date formats', async () => {
        // Test invalid start date
        const invalidStartDto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: 'Test Debt',
          creditor: 'John Doe',
          principalAmount: 1000,
          startDate: 'invalid-date',
        });

        const startErrors = await validate(invalidStartDto);
        expect(startErrors.length).toBeGreaterThan(0);

        // Test invalid maturity date
        const invalidMaturityDto = plainToClass(CreateDebtDto, {
          type: DebtType.PERSONAL,
          name: 'Test Debt',
          creditor: 'John Doe',
          principalAmount: 1000,
          startDate: '2024-01-01',
          maturityDate: 'invalid-date',
        });

        const maturityErrors = await validate(invalidMaturityDto);
        expect(maturityErrors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CreateDebtPaymentDto Validation', () => {
    it('should validate valid payment', async () => {
      const dto = plainToClass(CreateDebtPaymentDto, {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 450,
        interestAmount: 50,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate required fields', async () => {
      const dto = plainToClass(CreateDebtPaymentDto, {});
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'amount')).toBe(true);
      expect(errors.some(e => e.property === 'paymentDate')).toBe(true);
      expect(errors.some(e => e.property === 'principalAmount')).toBe(true);
    });

    it('should validate amount constraints', async () => {
      // Test zero amount
      const zeroDto = plainToClass(CreateDebtPaymentDto, {
        amount: 0,
        paymentDate: '2024-02-01',
        principalAmount: 0,
      });

      const zeroErrors = await validate(zeroDto);
      expect(zeroErrors.length).toBeGreaterThan(0);

      // Test negative amount
      const negativeDto = plainToClass(CreateDebtPaymentDto, {
        amount: -100,
        paymentDate: '2024-02-01',
        principalAmount: -100,
      });

      const negativeErrors = await validate(negativeDto);
      expect(negativeErrors.length).toBeGreaterThan(0);
    });

    it('should validate date format', async () => {
      const dto = plainToClass(CreateDebtPaymentDto, {
        amount: 500,
        paymentDate: 'invalid-date',
        principalAmount: 450,
        interestAmount: 50,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate UUID format for transaction ID', async () => {
      const dto = plainToClass(CreateDebtPaymentDto, {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 450,
        interestAmount: 50,
        transactionId: 'invalid-uuid',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should allow valid UUID for transaction ID', async () => {
      const dto = plainToClass(CreateDebtPaymentDto, {
        amount: 500,
        paymentDate: '2024-02-01',
        principalAmount: 450,
        interestAmount: 50,
        transactionId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('DebtFiltersDto Validation', () => {
    it('should validate valid filters', async () => {
      const dto = plainToClass(DebtFiltersDto, {
        type: DebtType.PERSONAL,
        isActive: true,
        creditor: 'Bank ABC',
        search: 'loan',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate debt type enum', async () => {
      const dto = plainToClass(DebtFiltersDto, {
        type: 'INVALID_TYPE',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate boolean conversion', async () => {
      const dto = plainToClass(DebtFiltersDto, {
        isActive: 'true',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.isActive).toBe(true);
    });

    it('should allow empty filters', async () => {
      const dto = plainToClass(DebtFiltersDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Edge Cases and Security Validation', () => {
    it('should handle malformed JSON gracefully', async () => {
      // This would typically be handled by the framework, but we test the DTO directly
      const malformedData = {
        type: DebtType.PERSONAL,
        name: 'Test',
        creditor: 'Test',
        principalAmount: 'not-a-number',
        startDate: '2024-01-01',
      };

      const dto = plainToClass(CreateDebtDto, malformedData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject SQL injection attempts in string fields', async () => {
      const maliciousDto = plainToClass(CreateDebtDto, {
        type: DebtType.PERSONAL,
        name: "'; DROP TABLE debts; --",
        creditor: "'; DROP TABLE users; --",
        principalAmount: 1000,
        startDate: '2024-01-01',
      });

      // The validation should pass (as these are just strings), 
      // but the actual SQL injection protection happens at the ORM level
      const errors = await validate(maliciousDto);
      expect(errors).toHaveLength(0);
      
      // Verify the strings are preserved as-is (not executed)
      expect(maliciousDto.name).toBe("'; DROP TABLE debts; --");
      expect(maliciousDto.creditor).toBe("'; DROP TABLE users; --");
    });

    it('should handle extremely large numbers', async () => {
      const dto = plainToClass(CreateDebtDto, {
        type: DebtType.PERSONAL,
        name: 'Test',
        creditor: 'Test',
        principalAmount: Number.MAX_SAFE_INTEGER,
        startDate: '2024-01-01',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0); // Should exceed our max limit
    });

    it('should handle special characters in text fields', async () => {
      const dto = plainToClass(CreateDebtDto, {
        type: DebtType.PERSONAL,
        name: 'Test Debt with émojis 🏦💰 and spëcial chars',
        creditor: 'Créditor with àccents',
        principalAmount: 1000,
        startDate: '2024-01-01',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
