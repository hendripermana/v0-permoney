import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    return this.healthService.checkHealth();
  }

  @Get('readiness')
  async getReadiness() {
    const health = await this.healthService.checkHealth();
    return {
      status: health.database.status === 'ok' ? 'ready' : 'not_ready',
      timestamp: health.timestamp,
      checks: {
        database: health.database,
      },
    };
  }

  @Get('liveness')
  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
