/**
 * Countries and Currencies Data Module
 * 
 * Comprehensive country and currency data for worldwide users
 * - Uses flagcdn.com for country flags
 * - Scalable for international expansion
 * - No hardcoding, data-driven approach
 */

export interface CountryOption {
  countryCode: string // ISO 3166-1 alpha-2
  countryName: string
  flagUrl: string // Flag URL
  currencyCode: string // ISO 4217 currency code
  currencyName: string
  currencySymbol: string
  locale: string // IETF language tag
  phoneCode: string
}

export interface CurrencyOption {
  currencyCode: string // ISO 4217
  currencyName: string
  currencySymbol: string
  symbolNative?: string
  decimalDigits: number
  rounding: number
  namePlural?: string
}

/**
 * Get flag URL from flagcdn.com
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param size - Flag size (w20, w40, w80, w160, w320)
 */
export function getFlagUrl(countryCode: string, size: 'w20' | 'w40' | 'w80' | 'w160' | 'w320' = 'w80'): string {
  return `https://flagcdn.com/${size}/${countryCode.toLowerCase()}.png`
}

/**
 * Major world currencies with formatting information
 * Based on ISO 4217 and Unicode CLDR
 */
export const CURRENCIES: CurrencyOption[] = [
  // Top Priority Currencies
  { currencyCode: 'IDR', currencyName: 'Indonesian Rupiah', currencySymbol: 'Rp', symbolNative: 'Rp', decimalDigits: 0, rounding: 1, namePlural: 'Indonesian rupiahs' },
  { currencyCode: 'USD', currencyName: 'US Dollar', currencySymbol: '$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'US dollars' },
  { currencyCode: 'EUR', currencyName: 'Euro', currencySymbol: '€', symbolNative: '€', decimalDigits: 2, rounding: 0, namePlural: 'euros' },
  { currencyCode: 'GBP', currencyName: 'British Pound', currencySymbol: '£', symbolNative: '£', decimalDigits: 2, rounding: 0, namePlural: 'British pounds' },
  { currencyCode: 'JPY', currencyName: 'Japanese Yen', currencySymbol: '¥', symbolNative: '¥', decimalDigits: 0, rounding: 0, namePlural: 'Japanese yen' },
  
  // Asia Pacific
  { currencyCode: 'SGD', currencyName: 'Singapore Dollar', currencySymbol: 'S$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Singapore dollars' },
  { currencyCode: 'MYR', currencyName: 'Malaysian Ringgit', currencySymbol: 'RM', symbolNative: 'RM', decimalDigits: 2, rounding: 0, namePlural: 'Malaysian ringgits' },
  { currencyCode: 'THB', currencyName: 'Thai Baht', currencySymbol: '฿', symbolNative: '฿', decimalDigits: 2, rounding: 0, namePlural: 'Thai baht' },
  { currencyCode: 'VND', currencyName: 'Vietnamese Dong', currencySymbol: '₫', symbolNative: '₫', decimalDigits: 0, rounding: 0, namePlural: 'Vietnamese dong' },
  { currencyCode: 'PHP', currencyName: 'Philippine Peso', currencySymbol: '₱', symbolNative: '₱', decimalDigits: 2, rounding: 0, namePlural: 'Philippine pesos' },
  { currencyCode: 'KRW', currencyName: 'South Korean Won', currencySymbol: '₩', symbolNative: '₩', decimalDigits: 0, rounding: 0, namePlural: 'South Korean won' },
  { currencyCode: 'CNY', currencyName: 'Chinese Yuan', currencySymbol: '¥', symbolNative: '¥', decimalDigits: 2, rounding: 0, namePlural: 'Chinese yuan' },
  { currencyCode: 'HKD', currencyName: 'Hong Kong Dollar', currencySymbol: 'HK$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Hong Kong dollars' },
  { currencyCode: 'TWD', currencyName: 'Taiwan Dollar', currencySymbol: 'NT$', symbolNative: 'NT$', decimalDigits: 2, rounding: 0, namePlural: 'Taiwan dollars' },
  { currencyCode: 'INR', currencyName: 'Indian Rupee', currencySymbol: '₹', symbolNative: '₹', decimalDigits: 2, rounding: 0, namePlural: 'Indian rupees' },
  { currencyCode: 'AUD', currencyName: 'Australian Dollar', currencySymbol: 'A$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Australian dollars' },
  { currencyCode: 'NZD', currencyName: 'New Zealand Dollar', currencySymbol: 'NZ$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'New Zealand dollars' },
  
  // Americas
  { currencyCode: 'CAD', currencyName: 'Canadian Dollar', currencySymbol: 'CA$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Canadian dollars' },
  { currencyCode: 'MXN', currencyName: 'Mexican Peso', currencySymbol: 'MX$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Mexican pesos' },
  { currencyCode: 'BRL', currencyName: 'Brazilian Real', currencySymbol: 'R$', symbolNative: 'R$', decimalDigits: 2, rounding: 0, namePlural: 'Brazilian reals' },
  { currencyCode: 'ARS', currencyName: 'Argentine Peso', currencySymbol: 'AR$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Argentine pesos' },
  { currencyCode: 'CLP', currencyName: 'Chilean Peso', currencySymbol: 'CL$', symbolNative: '$', decimalDigits: 0, rounding: 0, namePlural: 'Chilean pesos' },
  { currencyCode: 'COP', currencyName: 'Colombian Peso', currencySymbol: 'CO$', symbolNative: '$', decimalDigits: 0, rounding: 0, namePlural: 'Colombian pesos' },
  
  // Europe
  { currencyCode: 'CHF', currencyName: 'Swiss Franc', currencySymbol: 'CHF', symbolNative: 'CHF', decimalDigits: 2, rounding: 0, namePlural: 'Swiss francs' },
  { currencyCode: 'SEK', currencyName: 'Swedish Krona', currencySymbol: 'kr', symbolNative: 'kr', decimalDigits: 2, rounding: 0, namePlural: 'Swedish kronor' },
  { currencyCode: 'NOK', currencyName: 'Norwegian Krone', currencySymbol: 'kr', symbolNative: 'kr', decimalDigits: 2, rounding: 0, namePlural: 'Norwegian kroner' },
  { currencyCode: 'DKK', currencyName: 'Danish Krone', currencySymbol: 'kr', symbolNative: 'kr', decimalDigits: 2, rounding: 0, namePlural: 'Danish kroner' },
  { currencyCode: 'PLN', currencyName: 'Polish Zloty', currencySymbol: 'zł', symbolNative: 'zł', decimalDigits: 2, rounding: 0, namePlural: 'Polish zlotys' },
  { currencyCode: 'CZK', currencyName: 'Czech Koruna', currencySymbol: 'Kč', symbolNative: 'Kč', decimalDigits: 2, rounding: 0, namePlural: 'Czech korunas' },
  { currencyCode: 'RUB', currencyName: 'Russian Ruble', currencySymbol: '₽', symbolNative: '₽', decimalDigits: 2, rounding: 0, namePlural: 'Russian rubles' },
  
  // Middle East
  { currencyCode: 'AED', currencyName: 'UAE Dirham', currencySymbol: 'د.إ', symbolNative: 'د.إ', decimalDigits: 2, rounding: 0, namePlural: 'UAE dirhams' },
  { currencyCode: 'SAR', currencyName: 'Saudi Riyal', currencySymbol: 'ر.س', symbolNative: 'ر.س', decimalDigits: 2, rounding: 0, namePlural: 'Saudi riyals' },
  { currencyCode: 'ILS', currencyName: 'Israeli Shekel', currencySymbol: '₪', symbolNative: '₪', decimalDigits: 2, rounding: 0, namePlural: 'Israeli shekels' },
  { currencyCode: 'TRY', currencyName: 'Turkish Lira', currencySymbol: '₺', symbolNative: '₺', decimalDigits: 2, rounding: 0, namePlural: 'Turkish Lira' },
  
  // Africa
  { currencyCode: 'ZAR', currencyName: 'South African Rand', currencySymbol: 'R', symbolNative: 'R', decimalDigits: 2, rounding: 0, namePlural: 'South African rand' },
  { currencyCode: 'NGN', currencyName: 'Nigerian Naira', currencySymbol: '₦', symbolNative: '₦', decimalDigits: 2, rounding: 0, namePlural: 'Nigerian nairas' },
  { currencyCode: 'EGP', currencyName: 'Egyptian Pound', currencySymbol: 'E£', symbolNative: 'ج.م', decimalDigits: 2, rounding: 0, namePlural: 'Egyptian pounds' },
]

// Helper to get currency info
function getCurrencyInfo(code: string) {
  const currency = CURRENCIES.find(c => c.currencyCode === code)
  return currency || { currencyName: code, currencySymbol: code }
}

/**
 * Comprehensive country list with currency and locale information
 * Data sourced from ISO 3166-1 and Unicode CLDR
 */
export const COUNTRIES: CountryOption[] = [
  // Asia Pacific
  { countryCode: 'ID', countryName: 'Indonesia', flagUrl: getFlagUrl('ID'), currencyCode: 'IDR', ...getCurrencyInfo('IDR'), locale: 'id-ID', phoneCode: '+62' },
  { countryCode: 'SG', countryName: 'Singapore', flagUrl: getFlagUrl('SG'), currencyCode: 'SGD', ...getCurrencyInfo('SGD'), locale: 'en-SG', phoneCode: '+65' },
  { countryCode: 'MY', countryName: 'Malaysia', flagUrl: getFlagUrl('MY'), currencyCode: 'MYR', ...getCurrencyInfo('MYR'), locale: 'ms-MY', phoneCode: '+60' },
  { countryCode: 'TH', countryName: 'Thailand', flagUrl: getFlagUrl('TH'), currencyCode: 'THB', ...getCurrencyInfo('THB'), locale: 'th-TH', phoneCode: '+66' },
  { countryCode: 'VN', countryName: 'Vietnam', flagUrl: getFlagUrl('VN'), currencyCode: 'VND', ...getCurrencyInfo('VND'), locale: 'vi-VN', phoneCode: '+84' },
  { countryCode: 'PH', countryName: 'Philippines', flagUrl: getFlagUrl('PH'), currencyCode: 'PHP', ...getCurrencyInfo('PHP'), locale: 'en-PH', phoneCode: '+63' },
  { countryCode: 'JP', countryName: 'Japan', flagUrl: getFlagUrl('JP'), currencyCode: 'JPY', ...getCurrencyInfo('JPY'), locale: 'ja-JP', phoneCode: '+81' },
  { countryCode: 'KR', countryName: 'South Korea', flagUrl: getFlagUrl('KR'), currencyCode: 'KRW', ...getCurrencyInfo('KRW'), locale: 'ko-KR', phoneCode: '+82' },
  { countryCode: 'CN', countryName: 'China', flagUrl: getFlagUrl('CN'), currencyCode: 'CNY', ...getCurrencyInfo('CNY'), locale: 'zh-CN', phoneCode: '+86' },
  { countryCode: 'HK', countryName: 'Hong Kong', flagUrl: getFlagUrl('HK'), currencyCode: 'HKD', ...getCurrencyInfo('HKD'), locale: 'zh-HK', phoneCode: '+852' },
  { countryCode: 'TW', countryName: 'Taiwan', flagUrl: getFlagUrl('TW'), currencyCode: 'TWD', ...getCurrencyInfo('TWD'), locale: 'zh-TW', phoneCode: '+886' },
  { countryCode: 'IN', countryName: 'India', flagUrl: getFlagUrl('IN'), currencyCode: 'INR', ...getCurrencyInfo('INR'), locale: 'en-IN', phoneCode: '+91' },
  { countryCode: 'AU', countryName: 'Australia', flagUrl: getFlagUrl('AU'), currencyCode: 'AUD', ...getCurrencyInfo('AUD'), locale: 'en-AU', phoneCode: '+61' },
  { countryCode: 'NZ', countryName: 'New Zealand', flagUrl: getFlagUrl('NZ'), currencyCode: 'NZD', ...getCurrencyInfo('NZD'), locale: 'en-NZ', phoneCode: '+64' },

  // North America
  { countryCode: 'US', countryName: 'United States', flagUrl: getFlagUrl('US'), currencyCode: 'USD', ...getCurrencyInfo('USD'), locale: 'en-US', phoneCode: '+1' },
  { countryCode: 'CA', countryName: 'Canada', flagUrl: getFlagUrl('CA'), currencyCode: 'CAD', ...getCurrencyInfo('CAD'), locale: 'en-CA', phoneCode: '+1' },
  { countryCode: 'MX', countryName: 'Mexico', flagUrl: getFlagUrl('MX'), currencyCode: 'MXN', ...getCurrencyInfo('MXN'), locale: 'es-MX', phoneCode: '+52' },

  // Europe
  { countryCode: 'GB', countryName: 'United Kingdom', flagUrl: getFlagUrl('GB'), currencyCode: 'GBP', ...getCurrencyInfo('GBP'), locale: 'en-GB', phoneCode: '+44' },
  { countryCode: 'DE', countryName: 'Germany', flagUrl: getFlagUrl('DE'), currencyCode: 'EUR', ...getCurrencyInfo('EUR'), locale: 'de-DE', phoneCode: '+49' },
  { countryCode: 'FR', countryName: 'France', flagUrl: getFlagUrl('FR'), currencyCode: 'EUR', ...getCurrencyInfo('EUR'), locale: 'fr-FR', phoneCode: '+33' },
  { countryCode: 'IT', countryName: 'Italy', flagUrl: getFlagUrl('IT'), currencyCode: 'EUR', ...getCurrencyInfo('EUR'), locale: 'it-IT', phoneCode: '+39' },
  { countryCode: 'ES', countryName: 'Spain', flagUrl: getFlagUrl('ES'), currencyCode: 'EUR', ...getCurrencyInfo('EUR'), locale: 'es-ES', phoneCode: '+34' },
  { countryCode: 'NL', countryName: 'Netherlands', flagUrl: getFlagUrl('NL'), currencyCode: 'EUR', ...getCurrencyInfo('EUR'), locale: 'nl-NL', phoneCode: '+31' },
  { countryCode: 'BE', countryName: 'Belgium', flagUrl: getFlagUrl('BE'), currencyCode: 'EUR', ...getCurrencyInfo('EUR'), locale: 'nl-BE', phoneCode: '+32' },
  { countryCode: 'CH', countryName: 'Switzerland', flagUrl: getFlagUrl('CH'), currencyCode: 'CHF', ...getCurrencyInfo('CHF'), locale: 'de-CH', phoneCode: '+41' },
  { countryCode: 'AT', countryName: 'Austria', flagUrl: getFlagUrl('AT'), currencyCode: 'EUR', ...getCurrencyInfo('EUR'), locale: 'de-AT', phoneCode: '+43' },
  { countryCode: 'SE', countryName: 'Sweden', flagUrl: getFlagUrl('SE'), currencyCode: 'SEK', ...getCurrencyInfo('SEK'), locale: 'sv-SE', phoneCode: '+46' },
  { countryCode: 'NO', countryName: 'Norway', flagUrl: getFlagUrl('NO'), currencyCode: 'NOK', ...getCurrencyInfo('NOK'), locale: 'nb-NO', phoneCode: '+47' },
  { countryCode: 'DK', countryName: 'Denmark', flagUrl: getFlagUrl('DK'), currencyCode: 'DKK', ...getCurrencyInfo('DKK'), locale: 'da-DK', phoneCode: '+45' },
  { countryCode: 'FI', countryName: 'Finland', flagUrl: getFlagUrl('FI'), currencyCode: 'EUR', ...getCurrencyInfo('EUR'), locale: 'fi-FI', phoneCode: '+358' },
  { countryCode: 'PL', countryName: 'Poland', flagUrl: getFlagUrl('PL'), currencyCode: 'PLN', ...getCurrencyInfo('PLN'), locale: 'pl-PL', phoneCode: '+48' },
  { countryCode: 'CZ', countryName: 'Czech Republic', flagUrl: getFlagUrl('CZ'), currencyCode: 'CZK', ...getCurrencyInfo('CZK'), locale: 'cs-CZ', phoneCode: '+420' },
  { countryCode: 'RU', countryName: 'Russia', flagUrl: getFlagUrl('RU'), currencyCode: 'RUB', ...getCurrencyInfo('RUB'), locale: 'ru-RU', phoneCode: '+7' },

  // Middle East
  { countryCode: 'AE', countryName: 'United Arab Emirates', flagUrl: getFlagUrl('AE'), currencyCode: 'AED', ...getCurrencyInfo('AED'), locale: 'ar-AE', phoneCode: '+971' },
  { countryCode: 'SA', countryName: 'Saudi Arabia', flagUrl: getFlagUrl('SA'), currencyCode: 'SAR', ...getCurrencyInfo('SAR'), locale: 'ar-SA', phoneCode: '+966' },
  { countryCode: 'IL', countryName: 'Israel', flagUrl: getFlagUrl('IL'), currencyCode: 'ILS', ...getCurrencyInfo('ILS'), locale: 'he-IL', phoneCode: '+972' },
  { countryCode: 'TR', countryName: 'Turkey', flagUrl: getFlagUrl('TR'), currencyCode: 'TRY', ...getCurrencyInfo('TRY'), locale: 'tr-TR', phoneCode: '+90' },

  // South America
  { countryCode: 'BR', countryName: 'Brazil', flagUrl: getFlagUrl('BR'), currencyCode: 'BRL', ...getCurrencyInfo('BRL'), locale: 'pt-BR', phoneCode: '+55' },
  { countryCode: 'AR', countryName: 'Argentina', flagUrl: getFlagUrl('AR'), currencyCode: 'ARS', ...getCurrencyInfo('ARS'), locale: 'es-AR', phoneCode: '+54' },
  { countryCode: 'CL', countryName: 'Chile', flagUrl: getFlagUrl('CL'), currencyCode: 'CLP', ...getCurrencyInfo('CLP'), locale: 'es-CL', phoneCode: '+56' },
  { countryCode: 'CO', countryName: 'Colombia', flagUrl: getFlagUrl('CO'), currencyCode: 'COP', ...getCurrencyInfo('COP'), locale: 'es-CO', phoneCode: '+57' },

  // Africa
  { countryCode: 'ZA', countryName: 'South Africa', flagUrl: getFlagUrl('ZA'), currencyCode: 'ZAR', ...getCurrencyInfo('ZAR'), locale: 'en-ZA', phoneCode: '+27' },
  { countryCode: 'NG', countryName: 'Nigeria', flagUrl: getFlagUrl('NG'), currencyCode: 'NGN', ...getCurrencyInfo('NGN'), locale: 'en-NG', phoneCode: '+234' },
  { countryCode: 'EG', countryName: 'Egypt', flagUrl: getFlagUrl('EG'), currencyCode: 'EGP', ...getCurrencyInfo('EGP'), locale: 'ar-EG', phoneCode: '+20' },
]

/**
 * List all countries
 */
export function listCountries(): CountryOption[] {
  return COUNTRIES
}

/**
 * List all currencies
 */
export function listCurrencies(): CurrencyOption[] {
  return CURRENCIES
}

/**
 * Find country by code
 */
export function findCountry(code: string): CountryOption | undefined {
  return COUNTRIES.find(c => c.countryCode.toUpperCase() === code.toUpperCase())
}

/**
 * Find currency by code
 */
export function findCurrency(code: string): CurrencyOption | undefined {
  return CURRENCIES.find(c => c.currencyCode.toUpperCase() === code.toUpperCase())
}

/**
 * Get countries by currency
 */
export function getCountriesByCurrency(currencyCode: string): CountryOption[] {
  return COUNTRIES.filter(c => c.currencyCode.toUpperCase() === currencyCode.toUpperCase())
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currencyCode: string, locale?: string): string {
  const currency = findCurrency(currencyCode)
  if (!currency) {
    return `${currencyCode} ${amount.toFixed(2)}`
  }

  const country = COUNTRIES.find(c => c.currencyCode === currencyCode)
  const formatLocale = locale || country?.locale || 'en-US'

  try {
    return new Intl.NumberFormat(formatLocale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currency.decimalDigits,
      maximumFractionDigits: currency.decimalDigits,
    }).format(amount)
  } catch (error) {
    // Fallback if Intl fails
    return `${currency.currencySymbol}${amount.toFixed(currency.decimalDigits)}`
  }
}

/**
 * Parse currency amount from string
 */
export function parseCurrencyAmount(value: string): number {
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = value.replace(/[^\d.-]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string, useNative: boolean = false): string {
  const currency = findCurrency(currencyCode)
  if (!currency) return currencyCode
  return useNative && currency.symbolNative ? currency.symbolNative : currency.currencySymbol
}

/**
 * Default country (Indonesia - primary market)
 */
export const DEFAULT_COUNTRY: CountryOption = COUNTRIES[0]

/**
 * Default currency (Indonesian Rupiah)
 */
export const DEFAULT_CURRENCY: CurrencyOption = CURRENCIES[0]
