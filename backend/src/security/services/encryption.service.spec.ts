import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'ENCRYPTION_MASTER_KEY':
          return 'test-master-key-32-characters-long';
        case 'KEY_DERIVATION_SALT':
          return '0123456789abcdef0123456789abcdef';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const plaintext = 'sensitive information';
      
      const encrypted = await service.encryptData(plaintext);
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      
      const decrypted = await service.decryptData(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different encrypted values for same input', async () => {
      const plaintext = 'test data';
      
      const encrypted1 = await service.encryptData(plaintext);
      const encrypted2 = await service.encryptData(plaintext);
      
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should fail to decrypt with wrong data', async () => {
      const plaintext = 'test data';
      const encrypted = await service.encryptData(plaintext);
      
      // Tamper with encrypted data
      const tamperedData = {
        ...encrypted,
        encrypted: encrypted.encrypted.slice(0, -2) + '00',
      };
      
      await expect(service.decryptData(tamperedData)).rejects.toThrow('Decryption failed');
    });
  });

  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'testPassword123';
      
      const hash = await service.hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      
      const isValid = await service.verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await service.verifyPassword('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'testPassword123';
      
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      
      // Both should verify correctly
      expect(await service.verifyPassword(password, hash1)).toBe(true);
      expect(await service.verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate secure tokens of correct length', () => {
      const token32 = service.generateSecureToken(32);
      expect(token32).toHaveLength(64); // hex encoding doubles length
      
      const token16 = service.generateSecureToken(16);
      expect(token16).toHaveLength(32);
    });

    it('should generate different tokens each time', () => {
      const token1 = service.generateSecureToken();
      const token2 = service.generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateHMAC and verifyHMAC', () => {
    it('should generate and verify HMAC correctly', () => {
      const data = 'test data for HMAC';
      
      const hmac = service.generateHMAC(data);
      expect(hmac).toBeDefined();
      expect(typeof hmac).toBe('string');
      
      const isValid = service.verifyHMAC(data, hmac);
      expect(isValid).toBe(true);
      
      const isInvalid = service.verifyHMAC('tampered data', hmac);
      expect(isInvalid).toBe(false);
    });

    it('should work with custom secret', () => {
      const data = 'test data';
      const secret = 'custom-secret';
      
      const hmac = service.generateHMAC(data, secret);
      const isValid = service.verifyHMAC(data, hmac, secret);
      expect(isValid).toBe(true);
      
      // Should fail with different secret
      const isInvalidSecret = service.verifyHMAC(data, hmac, 'wrong-secret');
      expect(isInvalidSecret).toBe(false);
    });
  });

  describe('encryptField and decryptField', () => {
    it('should encrypt and decrypt field data correctly', async () => {
      const fieldValue = 'sensitive field data';
      const fieldName = 'creditCardNumber';
      
      const encrypted = await service.encryptField(fieldValue, fieldName);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(fieldValue);
      
      const decrypted = await service.decryptField(encrypted, fieldName);
      expect(decrypted).toBe(fieldValue);
    });

    it('should handle empty values', async () => {
      const emptyValue = '';
      const fieldName = 'testField';
      
      const encrypted = await service.encryptField(emptyValue, fieldName);
      expect(encrypted).toBe(emptyValue);
      
      const decrypted = await service.decryptField(encrypted, fieldName);
      expect(decrypted).toBe(emptyValue);
    });

    it('should fail to decrypt field with wrong field name', async () => {
      const fieldValue = 'test data';
      const fieldName = 'testField';
      
      const encrypted = await service.encryptField(fieldValue, fieldName);
      
      await expect(
        service.decryptField(encrypted, 'wrongFieldName')
      ).rejects.toThrow('Field decryption failed');
    });
  });

  describe('deriveUserKey', () => {
    it('should derive consistent keys for same user and purpose', () => {
      const userId = 'user123';
      const purpose = 'encryption';
      
      const key1 = service.deriveUserKey(userId, purpose);
      const key2 = service.deriveUserKey(userId, purpose);
      
      expect(key1.equals(key2)).toBe(true);
    });

    it('should derive different keys for different users', () => {
      const purpose = 'encryption';
      
      const key1 = service.deriveUserKey('user1', purpose);
      const key2 = service.deriveUserKey('user2', purpose);
      
      expect(key1.equals(key2)).toBe(false);
    });

    it('should derive different keys for different purposes', () => {
      const userId = 'user123';
      
      const key1 = service.deriveUserKey(userId, 'encryption');
      const key2 = service.deriveUserKey(userId, 'signing');
      
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when encryption keys are not configured', () => {
      const badConfigService = {
        get: jest.fn(() => undefined),
      };

      expect(() => {
        new EncryptionService(badConfigService as any);
      }).toThrow('Encryption keys not configured');
    });
  });
});
