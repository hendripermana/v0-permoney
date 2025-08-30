import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { testConfiguration } from '../config/test-configuration';
import { CacheService } from '../cache/cache.service';
import { RedisService } from '../cache/redis.service';
import { RequestContextService } from '../common/services/request-context.service';
import { HealthService } from '../health/health.service';
import { PrismaService } from '../prisma/prisma.service';
import { 
  BusinessLogicException, 
  ValidationException, 
  PermissionDeniedException,
  InsufficientFundsException,
  InvalidCurrencyException 
} from '../common/exceptions/custom.exceptions';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { AbstractBaseRepository } from '../common/base/base.repository';
import { AbstractBaseService } from '../common/base/base.service';

describe('Core Backend Services Architecture', () => {
  let module: TestingModule;
  let configService: ConfigService;
  let cacheService: CacheService;
  let redisService: RedisService;
  let requestContextService: RequestContextService;
  let healthService: HealthService;
  let logger: Logger;

  beforeAll(async () => {
    // Create a comprehensive test module that properly handles all dependencies
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
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            reset: jest.fn(),
            wrap: jest.fn(),
          } as Partial<Cache>,
        },
        // Cache service with mocked dependencies
        CacheService,
        // Mock Redis service
        {
          provide: RedisService,
          useValue: {
            ping: jest.fn().mockResolvedValue('PONG'),
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            exists: jest.fn(),
            expire: jest.fn(),
            hget: jest.fn(),
            hset: jest.fn(),
            hgetall: jest.fn(),
            hdel: jest.fn(),
            lpush: jest.fn(),
            rpop: jest.fn(),
            lrange: jest.fn(),
            sadd: jest.fn(),
            srem: jest.fn(),
            smembers: jest.fn(),
            publish: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            flushall: jest.fn(),
            setSession: jest.fn(),
            getSession: jest.fn(),
            deleteSession: jest.fn(),
            extendSession: jest.fn(),
            incrementRateLimit: jest.fn(),
            getRateLimit: jest.fn(),
            getClient: jest.fn(),
            getSubscriber: jest.fn(),
            getPublisher: jest.fn(),
          },
        },
        // Request context service
        RequestContextService,
        // Mock Prisma service
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
            $connect: jest.fn(),
            $disconnect: jest.fn(),
          },
        },
        // Health service with mocked dependencies
        HealthService,
        // Logging interceptor with mocked dependencies
        {
          provide: LoggingInterceptor,
          useFactory: (requestContext: RequestContextService) => 
            new LoggingInterceptor(requestContext),
          inject: [RequestContextService],
        },
      ],
    }).compile();

    // Get services from the module
    configService = module.get<ConfigService>(ConfigService);
    cacheService = module.get<CacheService>(CacheService);
    redisService = module.get<RedisService>(RedisService);
    requestContextService = module.get<RequestContextService>(RequestContextService);
    healthService = module.get<HealthService>(HealthService);
    logger = new Logger('ArchitectureTest');
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Configuration Management', () => {
    it('should load and validate configuration correctly', () => {
      expect(configService).toBeDefined();
      
      const appConfig = configService.get('app');
      const databaseConfig = configService.get('database');
      const redisConfig = configService.get('redis');
      const authConfig = configService.get('auth');
      const cacheConfig = configService.get('cache');
      const securityConfig = configService.get('security');

      expect(appConfig).toBeDefined();
      expect(appConfig.port).toBeDefined();
      expect(appConfig.environment).toBeDefined();
      expect(appConfig.apiPrefix).toBeDefined();

      expect(databaseConfig).toBeDefined();
      expect(databaseConfig.url).toBeDefined();
      expect(databaseConfig.maxConnections).toBeDefined();

      expect(redisConfig).toBeDefined();
      expect(redisConfig.url).toBeDefined();
      expect(redisConfig.maxRetries).toBeDefined();

      expect(authConfig).toBeDefined();
      expect(authConfig.jwtSecret).toBeDefined();
      expect(authConfig.sessionSecret).toBeDefined();

      expect(cacheConfig).toBeDefined();
      expect(cacheConfig.defaultTtl).toBeDefined();
      expect(cacheConfig.maxItems).toBeDefined();

      expect(securityConfig).toBeDefined();
      expect(securityConfig.corsOrigins).toBeDefined();
      expect(securityConfig.rateLimitWindow).toBeDefined();
    });

    it('should have proper default values', () => {
      const appConfig = configService.get('app');
      expect(appConfig.port).toBe(3001);
      expect(appConfig.environment).toBe('development');
      expect(appConfig.apiPrefix).toBe('api');

      const cacheConfig = configService.get('cache');
      expect(cacheConfig.defaultTtl).toBe(3600);
      expect(cacheConfig.maxItems).toBe(1000);
    });
  });

  describe('Dependency Injection', () => {
    it('should properly inject all core services', () => {
      expect(configService).toBeDefined();
      expect(cacheService).toBeDefined();
      expect(redisService).toBeDefined();
      expect(requestContextService).toBeDefined();
      expect(healthService).toBeDefined();
    });

    it('should create services with proper dependencies', () => {
      expect(cacheService).toBeInstanceOf(CacheService);
      expect(requestContextService).toBeInstanceOf(RequestContextService);
      expect(healthService).toBeInstanceOf(HealthService);
    });
  });

  describe('Cache Service', () => {
    it('should provide cache operations', () => {
      expect(cacheService.get).toBeDefined();
      expect(cacheService.set).toBeDefined();
      expect(cacheService.del).toBeDefined();
      expect(cacheService.reset).toBeDefined();
      expect(cacheService.wrap).toBeDefined();
      expect(cacheService.getOrSet).toBeDefined();
    });

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

    it('should handle cache operations gracefully', async () => {
      // Test that cache operations don't throw errors
      await expect(cacheService.get('test-key')).resolves.not.toThrow();
      await expect(cacheService.set('test-key', 'test-value')).resolves.not.toThrow();
      await expect(cacheService.del('test-key')).resolves.not.toThrow();
    });
  });

  describe('Redis Service', () => {
    it('should provide Redis operations', () => {
      expect(redisService.ping).toBeDefined();
      expect(redisService.get).toBeDefined();
      expect(redisService.set).toBeDefined();
      expect(redisService.del).toBeDefined();
      expect(redisService.exists).toBeDefined();
      expect(redisService.expire).toBeDefined();
    });

    it('should provide hash operations', () => {
      expect(redisService.hget).toBeDefined();
      expect(redisService.hset).toBeDefined();
      expect(redisService.hgetall).toBeDefined();
      expect(redisService.hdel).toBeDefined();
    });

    it('should provide list operations', () => {
      expect(redisService.lpush).toBeDefined();
      expect(redisService.rpop).toBeDefined();
      expect(redisService.lrange).toBeDefined();
    });

    it('should provide set operations', () => {
      expect(redisService.sadd).toBeDefined();
      expect(redisService.srem).toBeDefined();
      expect(redisService.smembers).toBeDefined();
    });

    it('should provide pub/sub operations', () => {
      expect(redisService.publish).toBeDefined();
      expect(redisService.subscribe).toBeDefined();
      expect(redisService.unsubscribe).toBeDefined();
    });

    it('should provide session management helpers', () => {
      expect(redisService.setSession).toBeDefined();
      expect(redisService.getSession).toBeDefined();
      expect(redisService.deleteSession).toBeDefined();
      expect(redisService.extendSession).toBeDefined();
    });

    it('should provide rate limiting helpers', () => {
      expect(redisService.incrementRateLimit).toBeDefined();
      expect(redisService.getRateLimit).toBeDefined();
    });

    it('should respond to ping', async () => {
      const result = await redisService.ping();
      expect(result).toBe('PONG');
    });
  });

  describe('Request Context Service', () => {
    it('should generate unique request IDs', () => {
      const requestId1 = requestContextService.getRequestId();
      const requestId2 = new RequestContextService().getRequestId();
      
      expect(requestId1).toBeDefined();
      expect(requestId2).toBeDefined();
      expect(typeof requestId1).toBe('string');
      expect(typeof requestId2).toBe('string');
      expect(requestId1).not.toBe(requestId2);
    });

    it('should track elapsed time', () => {
      const startTime = requestContextService.getStartTime();
      const elapsedTime = requestContextService.getElapsedTime();
      
      expect(startTime).toBeDefined();
      expect(typeof startTime).toBe('number');
      expect(elapsedTime).toBeGreaterThanOrEqual(0);
      expect(typeof elapsedTime).toBe('number');
    });

    it('should manage user context', () => {
      const userId = 'test-user-123';
      const householdId = 'test-household-456';
      
      requestContextService.setUserId(userId);
      requestContextService.setHouseholdId(householdId);
      
      expect(requestContextService.getUserId()).toBe(userId);
      expect(requestContextService.getHouseholdId()).toBe(householdId);
    });

    it('should manage metadata', () => {
      const key = 'testKey';
      const value = 'testValue';
      
      requestContextService.setMetadata(key, value);
      expect(requestContextService.getMetadata(key)).toBe(value);
      
      const allMetadata = requestContextService.getAllMetadata();
      expect(allMetadata[key]).toBe(value);
    });

    it('should provide complete context', () => {
      requestContextService.setUserId('user-123');
      requestContextService.setHouseholdId('household-456');
      requestContextService.setMetadata('test', 'value');
      
      const context = requestContextService.getContext();
      
      expect(context).toHaveProperty('requestId');
      expect(context).toHaveProperty('userId', 'user-123');
      expect(context).toHaveProperty('householdId', 'household-456');
      expect(context).toHaveProperty('elapsedTime');
      expect(context).toHaveProperty('metadata');
      expect(context.metadata.test).toBe('value');
    });
  });

  describe('Health Service', () => {
    it('should perform comprehensive health check', async () => {
      const healthCheck = await healthService.check();
      
      expect(healthCheck).toHaveProperty('status');
      expect(healthCheck).toHaveProperty('timestamp');
      expect(healthCheck).toHaveProperty('uptime');
      expect(healthCheck).toHaveProperty('checks');
      
      expect(healthCheck.checks).toHaveProperty('database');
      expect(healthCheck.checks).toHaveProperty('redis');
      expect(healthCheck.checks).toHaveProperty('memory');
      
      expect(['ok', 'error']).toContain(healthCheck.status);
      expect(typeof healthCheck.timestamp).toBe('string');
      expect(typeof healthCheck.uptime).toBe('number');
    });

    it('should perform readiness check', async () => {
      const readinessCheck = await healthService.readinessCheck();
      
      expect(readinessCheck).toHaveProperty('status');
      expect(readinessCheck).toHaveProperty('message');
      expect(typeof readinessCheck.status).toBe('string');
      expect(typeof readinessCheck.message).toBe('string');
    });

    it('should perform liveness check', async () => {
      const livenessCheck = await healthService.livenessCheck();
      
      expect(livenessCheck).toHaveProperty('status', 'alive');
      expect(livenessCheck).toHaveProperty('uptime');
      expect(typeof livenessCheck.uptime).toBe('number');
      expect(livenessCheck.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Exception Handling', () => {
    it('should provide custom business logic exceptions', () => {
      const error = new BusinessLogicException('Test business error');
      expect(error).toBeInstanceOf(BusinessLogicException);
      expect(error.message).toBe('Test business error');
      expect(error.getStatus()).toBe(400);
    });

    it('should provide validation exceptions', () => {
      const errors = ['field1 is required', 'field2 is invalid'];
      const error = new ValidationException('Validation failed', errors);
      expect(error).toBeInstanceOf(ValidationException);
      expect(error.message).toBe('Validation failed');
      expect(error.getStatus()).toBe(400);
    });

    it('should provide permission denied exceptions', () => {
      const error = new PermissionDeniedException('account', 'read');
      expect(error).toBeInstanceOf(PermissionDeniedException);
      expect(error.message).toBe('Permission denied for read on account');
      expect(error.getStatus()).toBe(403);
    });

    it('should provide insufficient funds exceptions', () => {
      const error = new InsufficientFundsException('acc-123', 1000, 500);
      expect(error).toBeInstanceOf(InsufficientFundsException);
      expect(error.message).toContain('Insufficient funds');
      expect(error.message).toContain('acc-123');
      expect(error.message).toContain('1000');
      expect(error.message).toContain('500');
    });

    it('should provide invalid currency exceptions', () => {
      const error = new InvalidCurrencyException('XYZ');
      expect(error).toBeInstanceOf(InvalidCurrencyException);
      expect(error.message).toBe('Invalid or unsupported currency: XYZ');
    });

    it('should provide global exception filter', () => {
      expect(GlobalExceptionFilter).toBeDefined();
      const filter = new GlobalExceptionFilter();
      expect(filter).toBeInstanceOf(GlobalExceptionFilter);
      expect(filter.catch).toBeDefined();
    });
  });

  describe('Base Classes', () => {
    it('should provide abstract base repository', () => {
      expect(AbstractBaseRepository).toBeDefined();
      expect(typeof AbstractBaseRepository).toBe('function');
    });

    it('should provide abstract base service', () => {
      expect(AbstractBaseService).toBeDefined();
      expect(typeof AbstractBaseService).toBe('function');
    });
  });

  describe('Architecture Integration', () => {
    it('should have all components properly wired', () => {
      // Verify that all major components are available and properly configured
      expect(configService).toBeDefined();
      expect(cacheService).toBeDefined();
      expect(redisService).toBeDefined();
      expect(requestContextService).toBeDefined();
      expect(healthService).toBeDefined();
    });

    it('should support enterprise patterns', () => {
      // Verify enterprise patterns are in place
      expect(BusinessLogicException).toBeDefined();
      expect(ValidationException).toBeDefined();
      expect(GlobalExceptionFilter).toBeDefined();
      expect(LoggingInterceptor).toBeDefined();
      expect(AbstractBaseRepository).toBeDefined();
      expect(AbstractBaseService).toBeDefined();
    });

    it('should be ready for modular development', () => {
      // Verify the architecture supports modular development
      const config = configService.get('app');
      expect(config).toBeDefined();
      expect(config.environment).toBeDefined();
      
      // Verify base classes are available for extension
      expect(AbstractBaseRepository).toBeDefined();
      expect(AbstractBaseService).toBeDefined();
      
      // Verify infrastructure services are ready
      expect(cacheService).toBeDefined();
      expect(redisService).toBeDefined();
      expect(healthService).toBeDefined();
    });
  });
});
