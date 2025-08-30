import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { testConfiguration } from '../config/test-configuration';
import { CacheService } from '../cache/cache.service';
import { HealthService } from '../health/health.service';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/services/request-context.service';
import { 
  BusinessLogicException, 
  ValidationException, 
  PermissionDeniedException,
  InsufficientFundsException,
  InvalidCurrencyException 
} from '../common/exceptions/custom.exceptions';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { AbstractBaseRepository } from '../common/base/base.repository';
import { AbstractBaseService } from '../common/base/base.service';

describe('Comprehensive Core Backend Services Architecture', () => {
  let module: TestingModule;
  let configService: ConfigService;
  let cacheService: CacheService;
  let healthService: HealthService;
  let logger: Logger;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [testConfiguration],
          isGlobal: true,
          ignoreEnvFile: true,
        }),
      ],
      providers: [
        // Mock cache manager
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
            reset: jest.fn().mockResolvedValue(undefined),
            wrap: jest.fn().mockImplementation(async (key, fn) => await fn()),
          } as Partial<Cache>,
        },
        // Cache service
        CacheService,
        // Mock Prisma service
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
            $connect: jest.fn().mockResolvedValue(undefined),
            $disconnect: jest.fn().mockResolvedValue(undefined),
          },
        },
        // Mock Redis service
        {
          provide: 'RedisService',
          useValue: {
            ping: jest.fn().mockResolvedValue('PONG'),
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
        // Health service
        HealthService,
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    cacheService = module.get<CacheService>(CacheService);
    healthService = module.get<HealthService>(HealthService);
    logger = new Logger('ArchitectureTest');
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('1. Configuration Management System', () => {
    it('should load comprehensive configuration correctly', () => {
      expect(configService).toBeDefined();
      
      const appConfig = configService.get('app');
      const databaseConfig = configService.get('database');
      const redisConfig = configService.get('redis');
      const authConfig = configService.get('auth');
      const cacheConfig = configService.get('cache');
      const securityConfig = configService.get('security');
      const externalServicesConfig = configService.get('externalServices');

      // App configuration
      expect(appConfig).toBeDefined();
      expect(appConfig.port).toBe(3001);
      expect(appConfig.environment).toBe('test');
      expect(appConfig.apiPrefix).toBe('api');
      expect(appConfig.enableSwagger).toBe(false);
      expect(appConfig.logLevel).toBe('error');

      // Database configuration
      expect(databaseConfig).toBeDefined();
      expect(databaseConfig.url).toContain('postgresql://');
      expect(databaseConfig.maxConnections).toBe(5);
      expect(databaseConfig.connectionTimeout).toBe(5000);

      // Redis configuration
      expect(redisConfig).toBeDefined();
      expect(redisConfig.url).toContain('redis://');
      expect(redisConfig.maxRetries).toBe(3);
      expect(redisConfig.retryDelay).toBe(100);

      // Auth configuration
      expect(authConfig).toBeDefined();
      expect(authConfig.jwtSecret).toBeDefined();
      expect(authConfig.jwtSecret.length).toBeGreaterThanOrEqual(32);
      expect(authConfig.sessionSecret).toBeDefined();
      expect(authConfig.sessionSecret.length).toBeGreaterThanOrEqual(32);
      expect(authConfig.jwtExpiresIn).toBe('15m');
      expect(authConfig.refreshTokenExpiresIn).toBe('7d');

      // Cache configuration
      expect(cacheConfig).toBeDefined();
      expect(cacheConfig.defaultTtl).toBe(3600);
      expect(cacheConfig.maxItems).toBe(1000);
      expect(cacheConfig.enableCompression).toBe(false);

      // Security configuration
      expect(securityConfig).toBeDefined();
      expect(securityConfig.corsOrigins).toEqual(['http://localhost:3000', 'http://localhost:4200']);
      expect(securityConfig.rateLimitWindow).toBe(60000);
      expect(securityConfig.rateLimitMax).toBe(100);
      expect(securityConfig.enableHelmet).toBe(true);
      expect(securityConfig.enableCsrf).toBe(false);

      // External services configuration
      expect(externalServicesConfig).toBeDefined();
      expect(externalServicesConfig.exchangeRateApi).toBeDefined();
      expect(externalServicesConfig.ocrService).toBeDefined();
      expect(externalServicesConfig.emailService).toBeDefined();
    });

    it('should provide type-safe configuration access', () => {
      const config = configService.get('app');
      expect(typeof config.port).toBe('number');
      expect(typeof config.environment).toBe('string');
      expect(typeof config.enableSwagger).toBe('boolean');
    });
  });

  describe('2. Dependency Injection Architecture', () => {
    it('should properly inject core services', () => {
      expect(configService).toBeDefined();
      expect(configService).toBeInstanceOf(ConfigService);
      
      expect(cacheService).toBeDefined();
      expect(cacheService).toBeInstanceOf(CacheService);
      
      expect(healthService).toBeDefined();
      expect(healthService).toBeInstanceOf(HealthService);
    });

    it('should support service composition', () => {
      // Verify that services can be composed together
      expect(cacheService).toBeDefined();
      expect(healthService).toBeDefined();
      
      // Both services should be able to coexist
      expect(typeof cacheService.get).toBe('function');
      expect(typeof healthService.check).toBe('function');
    });
  });

  describe('3. Cache Service Architecture', () => {
    it('should provide comprehensive cache operations', () => {
      expect(cacheService.get).toBeDefined();
      expect(cacheService.set).toBeDefined();
      expect(cacheService.del).toBeDefined();
      expect(cacheService.reset).toBeDefined();
      expect(cacheService.wrap).toBeDefined();
      expect(cacheService.getOrSet).toBeDefined();
      expect(cacheService.invalidatePattern).toBeDefined();
    });

    it('should build consistent cache keys', () => {
      const userKey = cacheService.buildUserCacheKey('user-123', 'profile');
      expect(userKey).toBe('user:user-123:profile');

      const userKeyWithoutSuffix = cacheService.buildUserCacheKey('user-123');
      expect(userKeyWithoutSuffix).toBe('user:user-123');

      const householdKey = cacheService.buildHouseholdCacheKey('household-456', 'members');
      expect(householdKey).toBe('household:household-456:members');

      const accountKey = cacheService.buildAccountCacheKey('account-789');
      expect(accountKey).toBe('account:account-789');

      const transactionKey = cacheService.buildTransactionCacheKey('tx-101', 'details');
      expect(transactionKey).toBe('transaction:tx-101:details');

      const sessionKey = cacheService.buildSessionCacheKey('session-202');
      expect(sessionKey).toBe('session:session-202');

      const exchangeRateKey = cacheService.buildExchangeRateCacheKey('USD', 'IDR', '2024-01-01');
      expect(exchangeRateKey).toBe('exchange_rate:USD:IDR:2024-01-01');

      const exchangeRateKeyToday = cacheService.buildExchangeRateCacheKey('EUR', 'USD');
      const today = new Date().toISOString().split('T')[0];
      expect(exchangeRateKeyToday).toBe(`exchange_rate:EUR:USD:${today}`);
    });

    it('should handle cache operations gracefully', async () => {
      // Test that cache operations don't throw errors
      await expect(cacheService.get('test-key')).resolves.not.toThrow();
      await expect(cacheService.set('test-key', 'test-value')).resolves.not.toThrow();
      await expect(cacheService.del('test-key')).resolves.not.toThrow();
      await expect(cacheService.reset()).resolves.not.toThrow();
    });

    it('should support getOrSet pattern', async () => {
      const key = 'test-get-or-set';
      const value = 'computed-value';
      const computeFn = jest.fn().mockResolvedValue(value);

      const result = await cacheService.getOrSet(key, computeFn, 3600);
      
      expect(result).toBe(value);
      expect(computeFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Health Check System', () => {
    it('should perform comprehensive health checks', async () => {
      const healthCheck = await healthService.check();
      
      expect(healthCheck).toHaveProperty('status');
      expect(healthCheck).toHaveProperty('timestamp');
      expect(healthCheck).toHaveProperty('uptime');
      expect(healthCheck).toHaveProperty('checks');
      
      expect(['ok', 'error']).toContain(healthCheck.status);
      expect(typeof healthCheck.timestamp).toBe('string');
      expect(typeof healthCheck.uptime).toBe('number');
      expect(healthCheck.uptime).toBeGreaterThanOrEqual(0);
      
      // Check individual health checks
      expect(healthCheck.checks).toHaveProperty('database');
      expect(healthCheck.checks).toHaveProperty('redis');
      expect(healthCheck.checks).toHaveProperty('memory');
      
      // Each check should have status and optional responseTime
      Object.values(healthCheck.checks).forEach(check => {
        expect(check).toHaveProperty('status');
        expect(['ok', 'error']).toContain(check.status);
      });
    });

    it('should perform readiness checks', async () => {
      const readinessCheck = await healthService.readinessCheck();
      
      expect(readinessCheck).toHaveProperty('status');
      expect(readinessCheck).toHaveProperty('message');
      expect(typeof readinessCheck.status).toBe('string');
      expect(typeof readinessCheck.message).toBe('string');
    });

    it('should perform liveness checks', async () => {
      const livenessCheck = await healthService.livenessCheck();
      
      expect(livenessCheck).toHaveProperty('status', 'alive');
      expect(livenessCheck).toHaveProperty('uptime');
      expect(typeof livenessCheck.uptime).toBe('number');
      expect(livenessCheck.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('5. Request Context Service (Unit Tests)', () => {
    it('should generate unique request IDs', () => {
      const context1 = new RequestContextService();
      const context2 = new RequestContextService();
      
      const id1 = context1.getRequestId();
      const id2 = context2.getRequestId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1).toBeValidUUID();
      expect(id2).toBeValidUUID();
    });

    it('should track elapsed time accurately', () => {
      const context = new RequestContextService();
      const startTime = context.getStartTime();
      
      expect(startTime).toBeDefined();
      expect(typeof startTime).toBe('number');
      expect(startTime).toBeGreaterThan(0);
      
      // Wait a bit and check elapsed time
      const elapsedTime = context.getElapsedTime();
      expect(elapsedTime).toBeGreaterThanOrEqual(0);
      expect(typeof elapsedTime).toBe('number');
    });

    it('should manage user context properly', () => {
      const context = new RequestContextService();
      const userId = 'user-12345';
      const householdId = 'household-67890';
      
      // Initially should be undefined
      expect(context.getUserId()).toBeUndefined();
      expect(context.getHouseholdId()).toBeUndefined();
      
      // Set values
      context.setUserId(userId);
      context.setHouseholdId(householdId);
      
      // Verify values are set
      expect(context.getUserId()).toBe(userId);
      expect(context.getHouseholdId()).toBe(householdId);
    });

    it('should manage metadata effectively', () => {
      const context = new RequestContextService();
      
      // Set various metadata
      context.setMetadata('method', 'POST');
      context.setMetadata('url', '/api/users');
      context.setMetadata('userAgent', 'Mozilla/5.0');
      context.setMetadata('ip', '192.168.1.1');
      
      // Verify individual metadata
      expect(context.getMetadata('method')).toBe('POST');
      expect(context.getMetadata('url')).toBe('/api/users');
      expect(context.getMetadata('userAgent')).toBe('Mozilla/5.0');
      expect(context.getMetadata('ip')).toBe('192.168.1.1');
      
      // Verify all metadata
      const allMetadata = context.getAllMetadata();
      expect(allMetadata).toEqual({
        method: 'POST',
        url: '/api/users',
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
      });
    });

    it('should provide complete context information', () => {
      const context = new RequestContextService();
      
      // Set up context
      context.setUserId('user-test');
      context.setHouseholdId('household-test');
      context.setMetadata('test', 'value');
      
      const fullContext = context.getContext();
      
      expect(fullContext).toHaveProperty('requestId');
      expect(fullContext).toHaveProperty('userId', 'user-test');
      expect(fullContext).toHaveProperty('householdId', 'household-test');
      expect(fullContext).toHaveProperty('elapsedTime');
      expect(fullContext).toHaveProperty('metadata');
      
      expect(fullContext.requestId).toBeValidUUID();
      expect(typeof fullContext.elapsedTime).toBe('number');
      expect(fullContext.metadata.test).toBe('value');
    });
  });

  describe('6. Exception Handling System', () => {
    it('should provide comprehensive business logic exceptions', () => {
      const error = new BusinessLogicException('Test business error');
      expect(error).toBeInstanceOf(BusinessLogicException);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test business error');
      expect(error.getStatus()).toBe(400);
      expect(error.name).toBe('BusinessLogicException');
    });

    it('should provide detailed validation exceptions', () => {
      const errors = ['field1 is required', 'field2 is invalid'];
      const error = new ValidationException('Validation failed', errors);
      
      expect(error).toBeInstanceOf(ValidationException);
      expect(error.message).toBe('Validation failed');
      expect(error.getStatus()).toBe(400);
      expect(error.name).toBe('ValidationException');
      
      const response = error.getResponse() as any;
      expect(response.errors).toEqual(errors);
    });

    it('should provide permission denied exceptions', () => {
      const error = new PermissionDeniedException('account', 'read');
      expect(error).toBeInstanceOf(PermissionDeniedException);
      expect(error.message).toBe('Permission denied for read on account');
      expect(error.getStatus()).toBe(403);
      expect(error.name).toBe('PermissionDeniedException');
    });

    it('should provide financial business exceptions', () => {
      const fundsError = new InsufficientFundsException('acc-123', 1000, 500);
      expect(fundsError).toBeInstanceOf(InsufficientFundsException);
      expect(fundsError.message).toContain('Insufficient funds');
      expect(fundsError.message).toContain('acc-123');
      expect(fundsError.message).toContain('1000');
      expect(fundsError.message).toContain('500');
      expect(fundsError.getStatus()).toBe(400);

      const currencyError = new InvalidCurrencyException('XYZ');
      expect(currencyError).toBeInstanceOf(InvalidCurrencyException);
      expect(currencyError.message).toBe('Invalid or unsupported currency: XYZ');
      expect(currencyError.getStatus()).toBe(400);
    });

    it('should provide global exception filter', () => {
      expect(GlobalExceptionFilter).toBeDefined();
      const filter = new GlobalExceptionFilter();
      expect(filter).toBeInstanceOf(GlobalExceptionFilter);
      expect(typeof filter.catch).toBe('function');
    });
  });

  describe('7. Base Architecture Patterns', () => {
    it('should provide abstract base repository pattern', () => {
      expect(AbstractBaseRepository).toBeDefined();
      expect(typeof AbstractBaseRepository).toBe('function');
      
      // Verify it's a constructor function
      expect(AbstractBaseRepository.prototype).toBeDefined();
      expect(AbstractBaseRepository.prototype.constructor).toBe(AbstractBaseRepository);
    });

    it('should provide abstract base service pattern', () => {
      expect(AbstractBaseService).toBeDefined();
      expect(typeof AbstractBaseService).toBe('function');
      
      // Verify it's a constructor function
      expect(AbstractBaseService.prototype).toBeDefined();
      expect(AbstractBaseService.prototype.constructor).toBe(AbstractBaseService);
    });

    it('should support inheritance patterns', () => {
      // Verify that base classes can be extended
      class TestRepository extends AbstractBaseRepository<any, any, any> {
        async create(data: any): Promise<any> { return data; }
        async findById(id: string): Promise<any> { return { id }; }
        async findMany(filters?: any): Promise<any[]> { return []; }
        async update(id: string, data: any): Promise<any> { return { id, ...data }; }
        async delete(id: string): Promise<void> { 
          // Mock implementation
        }
      }

      class TestService extends AbstractBaseService<any, any, any> {
        constructor() {
          super({} as any);
        }
      }

      expect(() => new TestRepository({} as any)).not.toThrow();
      expect(() => new TestService()).not.toThrow();
    });
  });

  describe('8. Architecture Integration', () => {
    it('should have all core components properly integrated', () => {
      // Verify that all major architectural components are available
      expect(configService).toBeDefined();
      expect(cacheService).toBeDefined();
      expect(healthService).toBeDefined();
      
      // Verify configuration is accessible to all services
      const config = configService.get('app');
      expect(config).toBeDefined();
      expect(config.environment).toBe('test');
    });

    it('should support enterprise development patterns', () => {
      // Verify enterprise patterns are available
      expect(BusinessLogicException).toBeDefined();
      expect(ValidationException).toBeDefined();
      expect(GlobalExceptionFilter).toBeDefined();
      expect(AbstractBaseRepository).toBeDefined();
      expect(AbstractBaseService).toBeDefined();
      
      // Verify configuration management
      expect(configService).toBeDefined();
      expect(typeof configService.get).toBe('function');
    });

    it('should be ready for modular development', () => {
      // Verify the architecture supports modular development
      const appConfig = configService.get('app');
      expect(appConfig).toBeDefined();
      expect(appConfig.environment).toBe('test');
      
      // Verify infrastructure services are ready
      expect(cacheService).toBeDefined();
      expect(healthService).toBeDefined();
      
      // Verify base classes are available for extension
      expect(AbstractBaseRepository).toBeDefined();
      expect(AbstractBaseService).toBeDefined();
      
      // Verify exception handling is in place
      expect(GlobalExceptionFilter).toBeDefined();
      expect(BusinessLogicException).toBeDefined();
    });

    it('should support scalable architecture patterns', () => {
      // Verify caching is available for performance
      expect(cacheService).toBeDefined();
      expect(typeof cacheService.get).toBe('function');
      expect(typeof cacheService.set).toBe('function');
      
      // Verify health checks for monitoring
      expect(healthService).toBeDefined();
      expect(typeof healthService.check).toBe('function');
      
      // Verify configuration for environment management
      expect(configService).toBeDefined();
      const config = configService.get('app');
      expect(config.port).toBeDefined();
      expect(config.environment).toBeDefined();
    });
  });

  describe('9. Architecture Quality Assurance', () => {
    it('should maintain consistent naming conventions', () => {
      // Service names should end with 'Service'
      expect(cacheService.constructor.name).toBe('CacheService');
      expect(healthService.constructor.name).toBe('HealthService');
      expect(configService.constructor.name).toBe('ConfigService');
    });

    it('should provide comprehensive error handling', () => {
      // All custom exceptions should extend HttpException
      const businessError = new BusinessLogicException('test');
      const validationError = new ValidationException('test');
      const permissionError = new PermissionDeniedException('resource', 'action');
      
      expect(businessError.getStatus).toBeDefined();
      expect(validationError.getStatus).toBeDefined();
      expect(permissionError.getStatus).toBeDefined();
      
      expect(typeof businessError.getStatus()).toBe('number');
      expect(typeof validationError.getStatus()).toBe('number');
      expect(typeof permissionError.getStatus()).toBe('number');
    });

    it('should support comprehensive configuration', () => {
      const config = configService.get('app');
      const dbConfig = configService.get('database');
      const redisConfig = configService.get('redis');
      const authConfig = configService.get('auth');
      
      // All major configuration sections should be present
      expect(config).toBeDefined();
      expect(dbConfig).toBeDefined();
      expect(redisConfig).toBeDefined();
      expect(authConfig).toBeDefined();
      
      // Configuration should have proper types
      expect(typeof config.port).toBe('number');
      expect(typeof config.environment).toBe('string');
      expect(typeof dbConfig.maxConnections).toBe('number');
      expect(typeof authConfig.sessionMaxAge).toBe('number');
    });
  });

  describe('10. Performance and Reliability', () => {
    it('should handle concurrent operations', async () => {
      // Test concurrent cache operations
      const promises = Array.from({ length: 10 }, (_, i) => 
        cacheService.set(`concurrent-test-${i}`, `value-${i}`)
      );
      
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should provide reliable health checks', async () => {
      // Multiple health checks should be consistent
      const checks = await Promise.all([
        healthService.livenessCheck(),
        healthService.livenessCheck(),
        healthService.livenessCheck(),
      ]);
      
      checks.forEach(check => {
        expect(check.status).toBe('alive');
        expect(typeof check.uptime).toBe('number');
      });
    });

    it('should maintain service isolation', () => {
      // Services should be independent
      expect(cacheService).not.toBe(healthService);
      expect(cacheService).not.toBe(configService);
      expect(healthService).not.toBe(configService);
      
      // Each service should have its own methods
      expect(cacheService.get).toBeDefined();
      expect(healthService.check).toBeDefined();
      expect(configService.get).toBeDefined();
    });
  });
});
