import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [CacheService, RedisService],
  exports: [CacheService, RedisService],
})
export class CacheModule {}


