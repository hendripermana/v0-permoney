import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';

interface ExternalService {
  name: string;
  url: string;
  timeout: number;
  critical: boolean;
}

@Injectable()
export class ExternalServiceHealthIndicator {
  private readonly services: ExternalService[] = [
    {
      name: 'exchange_rates_api',
      url: 'https://api.exchangerate-api.com/v4/latest/USD',
      timeout: 5000,
      critical: false,
    },
    {
      name: 'tokopedia_api',
      url: 'https://www.tokopedia.com',
      timeout: 10000,
      critical: false,
    },
    {
      name: 'shopee_api',
      url: 'https://shopee.co.id',
      timeout: 10000,
      critical: false,
    },
  ];

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async checkAllServices() {
    const results = await Promise.allSettled(
      this.services.map(service => this.checkService(service))
    );

    const serviceResults = results.map((result, index) => {
      const service = this.services[index];
      
      if (result.status === 'fulfilled') {
        return {
          name: service.name,
          ...result.value,
        };
      }
      
      return {
        name: service.name,
        status: 'error',
        error: result.reason?.message || 'Unknown error',
        critical: service.critical,
      };
    });

    const criticalServices = serviceResults.filter(s => s.critical);
    const criticalFailures = criticalServices.filter(s => s.status !== 'ok');
    
    return {
      status: criticalFailures.length > 0 ? 'degraded' : 'ok',
      services: serviceResults,
      summary: {
        total: this.services.length,
        healthy: serviceResults.filter(s => s.status === 'ok').length,
        unhealthy: serviceResults.filter(s => s.status !== 'ok').length,
        critical: criticalServices.length,
        criticalFailures: criticalFailures.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkService(service: ExternalService) {
    const startTime = Date.now();
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(service.url, {
          timeout: service.timeout,
          validateStatus: (status) => status < 500, // Accept 4xx as healthy
        }).pipe(
          timeout(service.timeout)
        )
      );

      const responseTime = Date.now() - startTime;
      
      return {
        status: 'ok',
        responseTime,
        statusCode: response.status,
        critical: service.critical,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'error',
        responseTime,
        error: error.message,
        critical: service.critical,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async checkSpecificService(serviceName: string) {
    const service = this.services.find(s => s.name === serviceName);
    
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    return this.checkService(service);
  }

  getConfiguredServices() {
    return this.services.map(service => ({
      name: service.name,
      url: service.url,
      timeout: service.timeout,
      critical: service.critical,
    }));
  }
}
