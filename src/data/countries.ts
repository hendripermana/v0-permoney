/**
 * Countries and Currencies Data Module
 * 
 * Comprehensive country and currency data for worldwide users
 * - Uses flagcdn.com for country flags
 * - Scalable for international expansion
 * - No hardcoding, data-driven approach
 */

export interface CountryOption {
  code: string // ISO 3166-1 alpha-2
  name: string
  flag: string // Flag emoji or URL
  currency: string // ISO 4217 currency code
  locale: string // IETF language tag
  phoneCode: string
}

export interface CurrencyOption {
  code: string // ISO 4217
  name: string
  symbol: string
  symbolNative?: string
  decimalDigits: number
  rounding: number
  namePlural?: string
}

/**
 * Comprehensive country list with currency and locale information
 * Data sourced from ISO 3166-1 and Unicode CLDR
 */
export const COUNTRIES: CountryOption[] = [
  // Asia Pacific
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: 'IDR', locale: 'id-ID', phoneCode: '+62' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', locale: 'en-SG', phoneCode: '+65' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', locale: 'ms-MY', phoneCode: '+60' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB', locale: 'th-TH', phoneCode: '+66' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', currency: 'VND', locale: 'vi-VN', phoneCode: '+84' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'PHP', locale: 'en-PH', phoneCode: '+63' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', locale: 'ja-JP', phoneCode: '+81' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', locale: 'ko-KR', phoneCode: '+82' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', locale: 'zh-CN', phoneCode: '+86' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', currency: 'HKD', locale: 'zh-HK', phoneCode: '+852' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', currency: 'TWD', locale: 'zh-TW', phoneCode: '+886' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', locale: 'en-IN', phoneCode: '+91' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', locale: 'en-AU', phoneCode: '+61' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currency: 'NZD', locale: 'en-NZ', phoneCode: '+64' },

  // North America
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', locale: 'en-US', phoneCode: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', locale: 'en-CA', phoneCode: '+1' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', locale: 'es-MX', phoneCode: '+52' },

  // Europe
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', locale: 'en-GB', phoneCode: '+44' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', locale: 'de-DE', phoneCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', locale: 'fr-FR', phoneCode: '+33' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', locale: 'it-IT', phoneCode: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', locale: 'es-ES', phoneCode: '+34' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', locale: 'nl-NL', phoneCode: '+31' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', currency: 'EUR', locale: 'nl-BE', phoneCode: '+32' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', locale: 'de-CH', phoneCode: '+41' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', currency: 'EUR', locale: 'de-AT', phoneCode: '+43' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK', locale: 'sv-SE', phoneCode: '+46' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'NOK', locale: 'nb-NO', phoneCode: '+47' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'DKK', locale: 'da-DK', phoneCode: '+45' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', currency: 'EUR', locale: 'fi-FI', phoneCode: '+358' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', currency: 'PLN', locale: 'pl-PL', phoneCode: '+48' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', currency: 'CZK', locale: 'cs-CZ', phoneCode: '+420' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', currency: 'RUB', locale: 'ru-RU', phoneCode: '+7' },

  // Middle East
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', locale: 'ar-AE', phoneCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', locale: 'ar-SA', phoneCode: '+966' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', currency: 'ILS', locale: 'he-IL', phoneCode: '+972' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY', locale: 'tr-TR', phoneCode: '+90' },

  // South America
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', locale: 'pt-BR', phoneCode: '+55' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'ARS', locale: 'es-AR', phoneCode: '+54' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', currency: 'CLP', locale: 'es-CL', phoneCode: '+56' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'COP', locale: 'es-CO', phoneCode: '+57' },

  // Africa
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', locale: 'en-ZA', phoneCode: '+27' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', locale: 'en-NG', phoneCode: '+234' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', locale: 'ar-EG', phoneCode: '+20' },
]

/**
 * Major world currencies with formatting information
 * Based on ISO 4217 and Unicode CLDR
 */
export const CURRENCIES: CurrencyOption[] = [
  // Top Priority Currencies
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', symbolNative: 'Rp', decimalDigits: 0, rounding: 1, namePlural: 'Indonesian rupiahs' },
  { code: 'USD', name: 'US Dollar', symbol: '$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'US dollars' },
  { code: 'EUR', name: 'Euro', symbol: '€', symbolNative: '€', decimalDigits: 2, rounding: 0, namePlural: 'euros' },
  { code: 'GBP', name: 'British Pound', symbol: '£', symbolNative: '£', decimalDigits: 2, rounding: 0, namePlural: 'British pounds' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', symbolNative: '¥', decimalDigits: 0, rounding: 0, namePlural: 'Japanese yen' },
  
  // Asia Pacific
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Singapore dollars' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', symbolNative: 'RM', decimalDigits: 2, rounding: 0, namePlural: 'Malaysian ringgits' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', symbolNative: '฿', decimalDigits: 2, rounding: 0, namePlural: 'Thai baht' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', symbolNative: '₫', decimalDigits: 0, rounding: 0, namePlural: 'Vietnamese dong' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', symbolNative: '₱', decimalDigits: 2, rounding: 0, namePlural: 'Philippine pesos' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', symbolNative: '₩', decimalDigits: 0, rounding: 0, namePlural: 'South Korean won' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', symbolNative: '¥', decimalDigits: 2, rounding: 0, namePlural: 'Chinese yuan' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Hong Kong dollars' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', symbolNative: 'NT$', decimalDigits: 2, rounding: 0, namePlural: 'Taiwan dollars' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', symbolNative: '₹', decimalDigits: 2, rounding: 0, namePlural: 'Indian rupees' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Australian dollars' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'New Zealand dollars' },
  
  // Americas
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Canadian dollars' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Mexican pesos' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', symbolNative: 'R$', decimalDigits: 2, rounding: 0, namePlural: 'Brazilian reals' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'AR$', symbolNative: '$', decimalDigits: 2, rounding: 0, namePlural: 'Argentine pesos' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CL$', symbolNative: '$', decimalDigits: 0, rounding: 0, namePlural: 'Chilean pesos' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'CO$', symbolNative: '$', decimalDigits: 0, rounding: 0, namePlural: 'Colombian pesos' },
  
  // Europe
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', symbolNative: 'CHF', decimalDigits: 2, rounding: 0, namePlural: 'Swiss francs' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', symbolNative: 'kr', decimalDigits: 2, rounding: 0, namePlural: 'Swedish kronor' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', symbolNative: 'kr', decimalDigits: 2, rounding: 0, namePlural: 'Norwegian kroner' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', symbolNative: 'kr', decimalDigits: 2, rounding: 0, namePlural: 'Danish kroner' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', symbolNative: 'zł', decimalDigits: 2, rounding: 0, namePlural: 'Polish zlotys' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', symbolNative: 'Kč', decimalDigits: 2, rounding: 0, namePlural: 'Czech korunas' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', symbolNative: '₽', decimalDigits: 2, rounding: 0, namePlural: 'Russian rubles' },
  
  // Middle East
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', symbolNative: 'د.إ', decimalDigits: 2, rounding: 0, namePlural: 'UAE dirhams' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', symbolNative: 'ر.س', decimalDigits: 2, rounding: 0, namePlural: 'Saudi riyals' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', symbolNative: '₪', decimalDigits: 2, rounding: 0, namePlural: 'Israeli shekels' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', symbolNative: '₺', decimalDigits: 2, rounding: 0, namePlural: 'Turkish Lira' },
  
  // Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', symbolNative: 'R', decimalDigits: 2, rounding: 0, namePlural: 'South African rand' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', symbolNative: '₦', decimalDigits: 2, rounding: 0, namePlural: 'Nigerian nairas' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', symbolNative: 'ج.م', decimalDigits: 2, rounding: 0, namePlural: 'Egyptian pounds' },
]

/**
 * Get flag URL from flagcdn.com
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param size - Flag size (w20, w40, w80, w160, w320)
 */
export function getFlagUrl(countryCode: string, size: 'w20' | 'w40' | 'w80' | 'w160' | 'w320' = 'w80'): string {
  return `https://flagcdn.com/${size}/${countryCode.toLowerCase()}.png`
}

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
  return COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase())
}

/**
 * Find currency by code
 */
export function findCurrency(code: string): CurrencyOption | undefined {
  return CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase())
}

/**
 * Get countries by currency
 */
export function getCountriesByCurrency(currencyCode: string): CountryOption[] {
  return COUNTRIES.filter(c => c.currency.toUpperCase() === currencyCode.toUpperCase())
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currencyCode: string, locale?: string): string {
  const currency = findCurrency(currencyCode)
  if (!currency) {
    return `${currencyCode} ${amount.toFixed(2)}`
  }

  const country = COUNTRIES.find(c => c.currency === currencyCode)
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
    return `${currency.symbol}${amount.toFixed(currency.decimalDigits)}`
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
  return useNative && currency.symbolNative ? currency.symbolNative : currency.symbol
}

/**
 * Default country (Indonesia - primary market)
 */
export const DEFAULT_COUNTRY: CountryOption = COUNTRIES[0]

/**
 * Default currency (Indonesian Rupiah)
 */
export const DEFAULT_CURRENCY: CurrencyOption = CURRENCIES[0]
