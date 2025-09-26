import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { RedisService } from '../../cache/redis.service';
import { RequestContextService } from '../services/request-context.service';
import { HealthService } from '../../health/health.service';
import { PrismaService } from '../../prisma/prisma.service';
import configuration from '../../config/configuration';

describe('Core Backend Services Architecture', () => {
  let module: TestingModule;
  let cacheService: CacheService;
  let redisService: RedisService;
  let requestContextService: RequestContextService;
  let healthService: HealthService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
      ],
      providers: [
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            reset: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            ping: jest.fn().mockResolvedValue('PONG'),
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
          },
        },
        RequestContextService,
        HealthService,
      ],
    }).compile();

    cacheService = module.get<CacheService>(CacheService);
    redisService = module.get<RedisService>(RedisService);
    requestContextService = module.get<RequestContextService>(RequestContextService);
    healthService = module.get<HealthService>(HealthService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Dependency Injection', () => {
    it('should create cache service', () => {
      expect(cacheService).toBeDefined();
    });

    it('should create redis service', () => {
      expect(redisService).toBeDefined();
    });

    it('should create request context service', () => {
      expect(requestContextService).toBeDefined();
    });

    it('should create health service', () => {
      expect(healthService).toBeDefined();
    });
  });

  describe('Request Context Service', () => {
    it('should generate request ID', () => {
      const requestId = requestContextService.getRequestId();
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      expect(requestId.length).toBeGreaterThan(0);
    });

    it('should track elapsed time', () => {
      const startTime = requestContextService.getStartTime();
      const elapsedTime = requestContextService.getElapsedTime();
      
      expect(startTime).toBeDefined();
      expect(elapsedTime).toBeGreaterThanOrEqual(0);
    });

    it('should manage metadata', () => {
      requestContextService.setMetadata('test', 'value');
      expect(requestContextService.getMetadata('test')).toBe('value');
      
      const allMetadata = requestContextService.getAllMetadata();
      expect(allMetadata.test).toBe('value');
    });

    it('should provide complete context', () => {
      requestContextService.setUserId('user-123');
      requestContextService.setHouseholdId('household-456');
      
      const context = requestContextService.getContext();
      
      expect(context).toHaveProperty('requestId');
      expect(context).toHaveProperty('userId', 'user-123');
      expect(context).toHaveProperty('householdId', 'household-456');
      expect(context).toHaveProperty('elapsedTime');
      expect(context).toHaveProperty('metadata');
    });
  });

  describe('Health Service', () => {
    it('should perform health check', async () => {
      const healthCheck = await healthService.check();
      
      expect(healthCheck).toHaveProperty('status');
      expect(healthCheck).toHaveProperty('timestamp');
      expect(healthCheck).toHaveProperty('uptime');
      expect(healthCheck).toHaveProperty('checks');
      expect(healthCheck.checks).toHaveProperty('database');
      expect(healthCheck.checks).toHaveProperty('redis');
      expect(healthCheck.checks).toHaveProperty('memory');
    });

    it('should perform readiness check', async () => {
      const readinessCheck = await healthService.readinessCheck();
      
      expect(readinessCheck).toHaveProperty('status');
      expect(readinessCheck).toHaveProperty('message');
    });

    it('should perform liveness check', async () => {
      const livenessCheck = await healthService.livenessCheck();
      
      expect(livenessCheck).toHaveProperty('status', 'alive');
      expect(livenessCheck).toHaveProperty('uptime');
      expect(typeof livenessCheck.uptime).toBe('number');
    });
  });

  describe('Cache Service', () => {
    it('should build cache keys correctly', () => {
      const userKey = cacheService.buildUserCacheKey('user-123', 'profile');
      expect(userKey).toBe('user:user-123:profile');

      const householdKey = cacheService.buildHouseholdCacheKey('household-456');
      expect(householdKey).toBe('household:household-456');

      const sessionKey = cacheService.buildSessionCacheKey('session-789');
      expect(sessionKey).toBe('session:session-789');

      const exchangeRateKey = cacheService.buildExchangeRateCacheKey('USD', 'IDR', '2024-01-01');
      expect(exchangeRateKey).toBe('exchange_rate:USD:IDR:2024-01-01');
    });
  });
});

describe('Base Repository and Service Classes', () => {
  it('should provide base repository interface', async () => {
    // Test that the base repository interface is properly defined
    const module = await import('../interfaces/base-repository.interface');
    expect(module.BaseRepository).toBeUndefined(); // It's an interface
  });

  it('should provide base service interface', async () => {
    // Test that the base service interface is properly defined
    const module = await import('../interfaces/base-service.interface');
    expect(module.BaseService).toBeUndefined(); // It's an interface
  });

  it('should provide abstract base repository', async () => {
    const module = await import('../base/base.repository');
    expect(module.AbstractBaseRepository).toBeDefined();
    expect(typeof module.AbstractBaseRepository).toBe('function');
  });

  it('should provide abstract base service', async () => {
    const module = await import('../base/base.service');
    expect(module.AbstractBaseService).toBeDefined();
    expect(typeof module.AbstractBaseService).toBe('function');
  });
});

describe('Exception Handling', () => {
  it('should provide custom exceptions', async () => {
    const module = await import('../exceptions/custom.exceptions');
    const {
      BusinessLogicException,
      ValidationException,
      PermissionDeniedException,
      InsufficientFundsException,
      InvalidCurrencyException,
      AccountingIntegrityException,
    } = module;

    expect(BusinessLogicException).toBeDefined();
    expect(ValidationException).toBeDefined();
    expect(PermissionDeniedException).toBeDefined();
    expect(InsufficientFundsException).toBeDefined();
    expect(InvalidCurrencyException).toBeDefined();
    expect(AccountingIntegrityException).toBeDefined();
  });

  it('should create custom exceptions with proper messages', async () => {
    const module = await import('../exceptions/custom.exceptions');
    const {
      PermissionDeniedException,
      InsufficientFundsException,
      InvalidCurrencyException,
    } = module;

    const permissionError = new PermissionDeniedException('account', 'read');
    expect(permissionError.message).toBe('Permission denied for read on account');

    const fundsError = new InsufficientFundsException('acc-123', 1000, 500);
    expect(fundsError.message).toContain('Insufficient funds');
    expect(fundsError.message).toContain('acc-123');

    const currencyError = new InvalidCurrencyException('XYZ');
    expect(currencyError.message).toBe('Invalid or unsupported currency: XYZ');
  });
});

describe('Configuration Management', () => {
  it('should load configuration correctly', () => {
    const config = configuration();
    
    expect(config).toHaveProperty('app');
    expect(config).toHaveProperty('database');
    expect(config).toHaveProperty('redis');
    expect(config).toHaveProperty('auth');
    expect(config).toHaveProperty('cache');
    expect(config).toHaveProperty('security');
    expect(config).toHaveProperty('externalServices');
  });

  it('should have proper default values', () => {
    const config = configuration();
    
    expect(config.app.port).toBe(3001);
    expect(config.app.environment).toBe('development');
    expect(config.app.apiPrefix).toBe('api');
    expect(config.database.url).toContain('postgresql://');
    expect(config.redis.url).toContain('redis://');
    expect(config.cache.defaultTtl).toBe(3600);
  });
});
