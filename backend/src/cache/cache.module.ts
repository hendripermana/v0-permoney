import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';
import { RedisService } from './redis.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        
        return {
          store: redisStore,
          url: redisUrl,
          ttl: 60 * 60 * 1000, // 1 hour default TTL
          max: 1000, // Maximum number of items in cache
          isGlobal: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService, RedisService],
  exports: [CacheService, RedisService, NestCacheModule],
})
export class CacheModule {}
