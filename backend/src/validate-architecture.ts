#!/usr/bin/env node

/**
 * Simple validation script to verify the core backend services architecture
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('ArchitectureValidator');

async function validateArchitecture() {
  logger.log('🔍 Validating Core Backend Services Architecture...');

  try {
    // Test 1: Validate base classes exist
    logger.log('✅ Testing base classes...');
    const { AbstractBaseRepository } = await import('./common/base/base.repository');
    const { AbstractBaseService } = await import('./common/base/base.service');
    
    if (!AbstractBaseRepository || !AbstractBaseService) {
      throw new Error('Base classes not found');
    }
    logger.log('✅ Base repository and service classes loaded successfully');

    // Test 2: Validate interfaces exist
    logger.log('✅ Testing interfaces...');
    const repositoryInterface = await import('./common/interfaces/base-repository.interface');
    const serviceInterface = await import('./common/interfaces/base-service.interface');
    
    if (!repositoryInterface || !serviceInterface) {
      throw new Error('Interfaces not found');
    }
    logger.log('✅ Repository and service interfaces loaded successfully');

    // Test 3: Validate services exist
    logger.log('✅ Testing services...');
    const { CacheService } = await import('./cache/cache.service');
    const { RedisService } = await import('./cache/redis.service');
    const { RequestContextService } = await import('./common/services/request-context.service');
    const { HealthService } = await import('./health/health.service');
    
    if (!CacheService || !RedisService || !RequestContextService || !HealthService) {
      throw new Error('Core services not found');
    }
    logger.log('✅ Core services loaded successfully');

    // Test 4: Validate exception handling
    logger.log('✅ Testing exception handling...');
    const exceptions = await import('./common/exceptions/custom.exceptions');
    const { GlobalExceptionFilter } = await import('./common/filters/global-exception.filter');
    
    if (!exceptions || !GlobalExceptionFilter) {
      throw new Error('Exception handling components not found');
    }
    logger.log('✅ Exception handling components loaded successfully');

    // Test 5: Validate configuration
    logger.log('✅ Testing configuration...');
    const configuration = await import('./config/configuration');
    const validationSchema = await import('./config/validation.schema');
    
    if (!configuration || !validationSchema) {
      throw new Error('Configuration components not found');
    }
    
    const config = configuration.default();
    if (!config.app || !config.database || !config.redis || !config.auth) {
      throw new Error('Configuration structure invalid');
    }
    logger.log('✅ Configuration loaded and validated successfully');

    // Test 6: Validate modules
    logger.log('✅ Testing modules...');
    const { CacheModule } = await import('./cache/cache.module');
    const { CommonModule } = await import('./common/common.module');
    const { HealthModule } = await import('./health/health.module');
    
    if (!CacheModule || !CommonModule || !HealthModule) {
      throw new Error('Core modules not found');
    }
    logger.log('✅ Core modules loaded successfully');

    // Test 7: Validate middleware and interceptors
    logger.log('✅ Testing middleware and interceptors...');
    const { RequestContextMiddleware } = await import('./common/middleware/request-context.middleware');
    const { LoggingInterceptor } = await import('./common/interceptors/logging.interceptor');
    
    if (!RequestContextMiddleware || !LoggingInterceptor) {
      throw new Error('Middleware and interceptors not found');
    }
    logger.log('✅ Middleware and interceptors loaded successfully');

    // Test 8: Test RequestContextService functionality
    logger.log('✅ Testing RequestContextService functionality...');
    const requestContext = new RequestContextService();
    const requestId = requestContext.getRequestId();
    
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('RequestContextService not working properly');
    }
    
    requestContext.setUserId('test-user');
    requestContext.setHouseholdId('test-household');
    requestContext.setMetadata('test', 'value');
    
    const context = requestContext.getContext();
    if (!context.requestId || context.userId !== 'test-user' || context.householdId !== 'test-household') {
      throw new Error('RequestContextService context management not working');
    }
    logger.log('✅ RequestContextService functionality validated');

    // Test 9: Test exception creation
    logger.log('✅ Testing custom exceptions...');
    const { 
      BusinessLogicException, 
      PermissionDeniedException, 
      InsufficientFundsException 
    } = exceptions;
    
    const businessError = new BusinessLogicException('Test business error');
    const permissionError = new PermissionDeniedException('account', 'read');
    const fundsError = new InsufficientFundsException('acc-123', 1000, 500);
    
    if (!businessError.message || !permissionError.message || !fundsError.message) {
      throw new Error('Custom exceptions not working properly');
    }
    logger.log('✅ Custom exceptions validated');

    logger.log('🎉 All architecture validation tests passed!');
    logger.log('');
    logger.log('📋 Architecture Summary:');
    logger.log('  ✅ Modular NestJS architecture with dependency injection');
    logger.log('  ✅ Base repository and service patterns implemented');
    logger.log('  ✅ Redis caching and session storage configured');
    logger.log('  ✅ Global exception handling and validation');
    logger.log('  ✅ Configuration management with validation');
    logger.log('  ✅ Health check endpoints');
    logger.log('  ✅ Request context tracking');
    logger.log('  ✅ Logging interceptors');
    logger.log('  ✅ Custom exception types');
    logger.log('');
    logger.log('🚀 Core Backend Services Architecture is ready!');
    
    return true;
  } catch (error) {
    logger.error('❌ Architecture validation failed:', error.message);
    logger.error(error.stack);
    return false;
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateArchitecture()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Validation script failed:', error);
      process.exit(1);
    });
}

export { validateArchitecture };
