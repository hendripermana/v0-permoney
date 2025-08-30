import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RetryService } from '../services/retry.service';
import { CircuitBreaker } from '../patterns/circuit-breaker';
import { FallbackService } from '../patterns/fallback.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RetryService,
    CircuitBreaker,
    FallbackService,
  ],
  exports: [
    RetryService,
    CircuitBreaker,
    FallbackService,
  ],
})
export class ResilienceModule {}
