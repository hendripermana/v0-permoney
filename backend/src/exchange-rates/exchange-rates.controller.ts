import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExchangeRatesService } from './exchange-rates.service';
import { CurrencyService } from './currency.service';
import {
  CurrencyConversionDto,
  ConversionResultDto,
  HistoricalRatesQueryDto,
  HistoricalRatesResponseDto,
} from './dto';

@ApiTags('Exchange Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exchange-rates')
export class ExchangeRatesController {
  private readonly logger = new Logger(ExchangeRatesController.name);

  constructor(
    private readonly exchangeRatesService: ExchangeRatesService,
    private readonly currencyService: CurrencyService
  ) {}

  @Get('current')
  @ApiOperation({
    summary: 'Get current exchange rates',
    description:
      'Retrieve current exchange rates for a base currency. Optionally filter by target currencies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current exchange rates retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid currency code or request parameters',
  })
  @ApiQuery({
    name: 'baseCurrency',
    description: 'Base currency code (ISO 4217)',
    example: 'IDR',
  })
  @ApiQuery({
    name: 'targetCurrencies',
    description: 'Comma-separated list of target currencies',
    required: false,
    example: 'USD,EUR,SGD',
  })
  async getCurrentRates(
    @Query('baseCurrency') baseCurrency: string,
    @Query('targetCurrencies') targetCurrencies?: string
  ) {
    this.logger.debug(
      `Getting current rates for ${baseCurrency}, targets: ${targetCurrencies || 'all'}`
    );

    const targetCurrencyList = targetCurrencies
      ? targetCurrencies.split(',').map(c => c.trim().toUpperCase())
      : undefined;

    const rates = await this.exchangeRatesService.getCurrentRates(
      baseCurrency.toUpperCase(),
      targetCurrencyList
    );

    return {
      baseCurrency: baseCurrency.toUpperCase(),
      targetCurrencies: targetCurrencyList,
      rates: rates.map(rate => ({
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: parseFloat(rate.rate.toString()),
        date: rate.date.toISOString().split('T')[0],
        source: rate.source,
      })),
      retrievedAt: new Date().toISOString(),
    };
  }

  @Get('historical')
  @ApiOperation({
    summary: 'Get historical exchange rates',
    description:
      'Retrieve historical exchange rates for a currency pair within a specified date range or period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical exchange rates retrieved successfully',
    type: HistoricalRatesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid currency codes or date parameters',
  })
  async getHistoricalRates(
    @Query() queryDto: HistoricalRatesQueryDto
  ): Promise<HistoricalRatesResponseDto> {
    this.logger.debug(
      `Getting historical rates for ${queryDto.baseCurrency}/${queryDto.targetCurrency}`
    );

    return await this.exchangeRatesService.getHistoricalRates(queryDto);
  }

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert currency amount',
    description:
      'Convert an amount from one currency to another using current or historical exchange rates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Currency conversion completed successfully',
    type: ConversionResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid conversion parameters or unsupported currency',
  })
  async convertCurrency(
    @Body() conversionDto: CurrencyConversionDto
  ): Promise<ConversionResultDto> {
    this.logger.debug(
      `Converting ${conversionDto.amountCents} from ${conversionDto.fromCurrency} to ${conversionDto.toCurrency}`
    );

    return await this.exchangeRatesService.convertCurrency(conversionDto);
  }

  @Get('currencies')
  @ApiOperation({
    summary: 'Get supported currencies',
    description:
      'Retrieve list of all supported currencies with their details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Supported currencies retrieved successfully',
  })
  async getSupportedCurrencies() {
    this.logger.debug('Getting supported currencies');

    const currencies = this.currencyService.getSupportedCurrencies();

    return {
      currencies: currencies.map(currency => ({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        decimalPlaces: currency.decimalPlaces,
        region: currency.region,
      })),
      total: currencies.length,
    };
  }

  @Get('currencies/by-region')
  @ApiOperation({
    summary: 'Get currencies by region',
    description: 'Retrieve currencies filtered by geographic region.',
  })
  @ApiResponse({
    status: 200,
    description: 'Regional currencies retrieved successfully',
  })
  @ApiQuery({
    name: 'region',
    description: 'Region code (e.g., ID, US, EU)',
    example: 'ID',
  })
  async getCurrenciesByRegion(@Query('region') region: string) {
    this.logger.debug(`Getting currencies for region: ${region}`);

    const currencies = this.currencyService.getCurrenciesByRegion(region);

    return {
      region: region.toUpperCase(),
      currencies: currencies.map(currency => ({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        decimalPlaces: currency.decimalPlaces,
      })),
      total: currencies.length,
    };
  }

  @Get('rate')
  @ApiOperation({
    summary: 'Get specific exchange rate',
    description: 'Get exchange rate for a specific currency pair and date.',
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange rate retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Exchange rate not found for the specified parameters',
  })
  @ApiQuery({
    name: 'fromCurrency',
    description: 'Source currency code (ISO 4217)',
    example: 'USD',
  })
  @ApiQuery({
    name: 'toCurrency',
    description: 'Target currency code (ISO 4217)',
    example: 'IDR',
  })
  @ApiQuery({
    name: 'date',
    description: 'Date for the exchange rate (YYYY-MM-DD). Defaults to today.',
    required: false,
    example: '2024-01-15',
  })
  async getExchangeRate(
    @Query('fromCurrency') fromCurrency: string,
    @Query('toCurrency') toCurrency: string,
    @Query('date') date?: string
  ) {
    this.logger.debug(
      `Getting exchange rate for ${fromCurrency}/${toCurrency} on ${date || 'today'}`
    );

    const targetDate = date ? new Date(date) : new Date();
    const exchangeRate = await this.exchangeRatesService.getHistoricalRate(
      fromCurrency.toUpperCase(),
      toCurrency.toUpperCase(),
      targetDate
    );

    if (!exchangeRate) {
      return {
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        date: targetDate.toISOString().split('T')[0],
        rate: null,
        available: false,
        message: 'Exchange rate not available for the specified date',
      };
    }

    return {
      fromCurrency: exchangeRate.fromCurrency,
      toCurrency: exchangeRate.toCurrency,
      rate: parseFloat(exchangeRate.rate.toString()),
      date: exchangeRate.date.toISOString().split('T')[0],
      source: exchangeRate.source,
      available: true,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh exchange rates',
    description:
      'Manually trigger refresh of current exchange rates from external sources.',
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange rates refreshed successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to refresh exchange rates',
  })
  async refreshExchangeRates() {
    this.logger.debug('Manually refreshing exchange rates');

    try {
      await this.exchangeRatesService.updateDailyRates();

      return {
        success: true,
        message: 'Exchange rates refreshed successfully',
        refreshedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to refresh exchange rates: ${errorMessage}`);

      return {
        success: false,
        message: 'Failed to refresh exchange rates',
        error: errorMessage,
        refreshedAt: new Date().toISOString(),
      };
    }
  }
}
