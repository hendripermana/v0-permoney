import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
}

export interface DecryptionInput {
  encrypted: string;
  iv: string;
  tag: string;
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltRounds = 12;

  private readonly encryptionKey: Buffer;
  private readonly keyDerivationSalt: Buffer;

  constructor(private readonly configService: ConfigService) {
    // Initialize encryption keys from environment
    const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    const derivationSalt = this.configService.get<string>('KEY_DERIVATION_SALT');

    if (!masterKey || !derivationSalt) {
      throw new Error('Encryption keys not configured. Set ENCRYPTION_MASTER_KEY and KEY_DERIVATION_SALT');
    }

    this.keyDerivationSalt = Buffer.from(derivationSalt, 'hex');
    this.encryptionKey = crypto.pbkdf2Sync(masterKey, this.keyDerivationSalt, 100000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt sensitive data at rest
   */
  async encryptData(plaintext: string): Promise<EncryptionResult> {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipherGCM(this.algorithm, this.encryptionKey, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      this.logger.error('Failed to encrypt data', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data at rest
   */
  async decryptData(input: DecryptionInput): Promise<string> {
    try {
      const iv = Buffer.from(input.iv, 'hex');
      const tag = Buffer.from(input.tag, 'hex');
      const decipher = crypto.createDecipherGCM(this.algorithm, this.encryptionKey, iv);
      
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(input.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt data', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash passwords securely
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      this.logger.error('Failed to hash password', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      this.logger.error('Failed to verify password', error);
      return false;
    }
  }

  /**
   * Generate secure random tokens
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate HMAC signature for data integrity
   */
  generateHMAC(data: string, secret?: string): string {
    const key = secret || this.encryptionKey.toString('hex');
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const key = secret || this.encryptionKey.toString('hex');
    const expectedSignature = crypto.createHmac('sha256', key).update(data).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  }

  /**
   * Encrypt field-level data for database storage
   */
  async encryptField(value: string, fieldName: string): Promise<string> {
    if (!value) return value;
    
    try {
      // Add field-specific salt for additional security
      const fieldSalt = crypto.createHash('sha256').update(fieldName).digest('hex').substring(0, 16);
      const saltedValue = value + fieldSalt;
      
      const result = await this.encryptData(saltedValue);
      return JSON.stringify(result);
    } catch (error) {
      this.logger.error(`Failed to encrypt field ${fieldName}`, error);
      throw new Error(`Field encryption failed for ${fieldName}`);
    }
  }

  /**
   * Decrypt field-level data from database
   */
  async decryptField(encryptedValue: string, fieldName: string): Promise<string> {
    if (!encryptedValue) return encryptedValue;
    
    try {
      const encryptionData = JSON.parse(encryptedValue) as DecryptionInput;
      const decryptedWithSalt = await this.decryptData(encryptionData);
      
      // Remove field-specific salt
      const fieldSalt = crypto.createHash('sha256').update(fieldName).digest('hex').substring(0, 16);
      return decryptedWithSalt.replace(fieldSalt, '');
    } catch (error) {
      this.logger.error(`Failed to decrypt field ${fieldName}`, error);
      throw new Error(`Field decryption failed for ${fieldName}`);
    }
  }

  /**
   * Generate key derivation for user-specific encryption
   */
  deriveUserKey(userId: string, purpose: string): Buffer {
    const userSalt = crypto.createHash('sha256').update(`${userId}:${purpose}`).digest();
    return crypto.pbkdf2Sync(this.encryptionKey, userSalt, 50000, this.keyLength, 'sha256');
  }

  /**
   * Secure data wiping
   */
  secureWipe(buffer: Buffer): void {
    if (buffer && buffer.length > 0) {
      crypto.randomFillSync(buffer);
      buffer.fill(0);
    }
  }
}
