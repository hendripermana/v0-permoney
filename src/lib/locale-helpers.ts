/**
 * Locale and Timezone Helper Functions
 * 
 * Maps country codes to appropriate locales and timezones
 * Used for user profile and household settings
 */

export const LOCALE_MAP: Record<string, string> = {
  // Southeast Asia
  'ID': 'id-ID', // Indonesia
  'SG': 'en-SG', // Singapore
  'MY': 'ms-MY', // Malaysia
  'PH': 'en-PH', // Philippines
  'TH': 'th-TH', // Thailand
  'VN': 'vi-VN', // Vietnam
  'MM': 'my-MM', // Myanmar
  'KH': 'km-KH', // Cambodia
  'LA': 'lo-LA', // Laos
  'BN': 'ms-BN', // Brunei
  
  // East Asia
  'JP': 'ja-JP', // Japan
  'KR': 'ko-KR', // South Korea
  'CN': 'zh-CN', // China
  'TW': 'zh-TW', // Taiwan
  'HK': 'zh-HK', // Hong Kong
  'MO': 'zh-MO', // Macau
  
  // South Asia
  'IN': 'en-IN', // India
  'PK': 'ur-PK', // Pakistan
  'BD': 'bn-BD', // Bangladesh
  'LK': 'si-LK', // Sri Lanka
  'NP': 'ne-NP', // Nepal
  
  // Middle East
  'SA': 'ar-SA', // Saudi Arabia
  'AE': 'ar-AE', // United Arab Emirates
  'QA': 'ar-QA', // Qatar
  'KW': 'ar-KW', // Kuwait
  'OM': 'ar-OM', // Oman
  'BH': 'ar-BH', // Bahrain
  'IQ': 'ar-IQ', // Iraq
  'JO': 'ar-JO', // Jordan
  'LB': 'ar-LB', // Lebanon
  'TR': 'tr-TR', // Turkey
  'IL': 'he-IL', // Israel
  'IR': 'fa-IR', // Iran
  
  // Europe
  'GB': 'en-GB', // United Kingdom
  'IE': 'en-IE', // Ireland
  'FR': 'fr-FR', // France
  'DE': 'de-DE', // Germany
  'ES': 'es-ES', // Spain
  'IT': 'it-IT', // Italy
  'PT': 'pt-PT', // Portugal
  'NL': 'nl-NL', // Netherlands
  'BE': 'nl-BE', // Belgium
  'CH': 'de-CH', // Switzerland
  'AT': 'de-AT', // Austria
  'SE': 'sv-SE', // Sweden
  'NO': 'no-NO', // Norway
  'DK': 'da-DK', // Denmark
  'FI': 'fi-FI', // Finland
  'PL': 'pl-PL', // Poland
  'CZ': 'cs-CZ', // Czech Republic
  'RU': 'ru-RU', // Russia
  'UA': 'uk-UA', // Ukraine
  'RO': 'ro-RO', // Romania
  'GR': 'el-GR', // Greece
  
  // Americas
  'US': 'en-US', // United States
  'CA': 'en-CA', // Canada
  'MX': 'es-MX', // Mexico
  'BR': 'pt-BR', // Brazil
  'AR': 'es-AR', // Argentina
  'CL': 'es-CL', // Chile
  'CO': 'es-CO', // Colombia
  'PE': 'es-PE', // Peru
  'VE': 'es-VE', // Venezuela
  
  // Oceania
  'AU': 'en-AU', // Australia
  'NZ': 'en-NZ', // New Zealand
  
  // Africa
  'ZA': 'en-ZA', // South Africa
  'EG': 'ar-EG', // Egypt
  'NG': 'en-NG', // Nigeria
  'KE': 'en-KE', // Kenya
  'MA': 'ar-MA', // Morocco
};

export const TIMEZONE_MAP: Record<string, string> = {
  // Southeast Asia
  'ID': 'Asia/Jakarta',
  'SG': 'Asia/Singapore',
  'MY': 'Asia/Kuala_Lumpur',
  'PH': 'Asia/Manila',
  'TH': 'Asia/Bangkok',
  'VN': 'Asia/Ho_Chi_Minh',
  'MM': 'Asia/Yangon',
  'KH': 'Asia/Phnom_Penh',
  'LA': 'Asia/Vientiane',
  'BN': 'Asia/Brunei',
  
  // East Asia
  'JP': 'Asia/Tokyo',
  'KR': 'Asia/Seoul',
  'CN': 'Asia/Shanghai',
  'TW': 'Asia/Taipei',
  'HK': 'Asia/Hong_Kong',
  'MO': 'Asia/Macau',
  
  // South Asia
  'IN': 'Asia/Kolkata',
  'PK': 'Asia/Karachi',
  'BD': 'Asia/Dhaka',
  'LK': 'Asia/Colombo',
  'NP': 'Asia/Kathmandu',
  
  // Middle East
  'SA': 'Asia/Riyadh',
  'AE': 'Asia/Dubai',
  'QA': 'Asia/Qatar',
  'KW': 'Asia/Kuwait',
  'OM': 'Asia/Muscat',
  'BH': 'Asia/Bahrain',
  'IQ': 'Asia/Baghdad',
  'JO': 'Asia/Amman',
  'LB': 'Asia/Beirut',
  'TR': 'Europe/Istanbul',
  'IL': 'Asia/Jerusalem',
  'IR': 'Asia/Tehran',
  
  // Europe
  'GB': 'Europe/London',
  'IE': 'Europe/Dublin',
  'FR': 'Europe/Paris',
  'DE': 'Europe/Berlin',
  'ES': 'Europe/Madrid',
  'IT': 'Europe/Rome',
  'PT': 'Europe/Lisbon',
  'NL': 'Europe/Amsterdam',
  'BE': 'Europe/Brussels',
  'CH': 'Europe/Zurich',
  'AT': 'Europe/Vienna',
  'SE': 'Europe/Stockholm',
  'NO': 'Europe/Oslo',
  'DK': 'Europe/Copenhagen',
  'FI': 'Europe/Helsinki',
  'PL': 'Europe/Warsaw',
  'CZ': 'Europe/Prague',
  'RU': 'Europe/Moscow',
  'UA': 'Europe/Kiev',
  'RO': 'Europe/Bucharest',
  'GR': 'Europe/Athens',
  
  // Americas
  'US': 'America/New_York',
  'CA': 'America/Toronto',
  'MX': 'America/Mexico_City',
  'BR': 'America/Sao_Paulo',
  'AR': 'America/Argentina/Buenos_Aires',
  'CL': 'America/Santiago',
  'CO': 'America/Bogota',
  'PE': 'America/Lima',
  'VE': 'America/Caracas',
  
  // Oceania
  'AU': 'Australia/Sydney',
  'NZ': 'Pacific/Auckland',
  
  // Africa
  'ZA': 'Africa/Johannesburg',
  'EG': 'Africa/Cairo',
  'NG': 'Africa/Lagos',
  'KE': 'Africa/Nairobi',
  'MA': 'Africa/Casablanca',
};

/**
 * Get locale for a country code
 */
export function getLocaleForCountry(countryCode: string): string {
  return LOCALE_MAP[countryCode.toUpperCase()] || 'id-ID';
}

/**
 * Get timezone for a country code
 */
export function getTimezoneForCountry(countryCode: string): string {
  return TIMEZONE_MAP[countryCode.toUpperCase()] || 'Asia/Jakarta';
}

/**
 * Get locale and timezone for a country code
 */
export function getLocaleAndTimezone(countryCode: string): { locale: string; timezone: string } {
  const code = countryCode.toUpperCase();
  return {
    locale: LOCALE_MAP[code] || 'id-ID',
    timezone: TIMEZONE_MAP[code] || 'Asia/Jakarta',
  };
}

/**
 * Format date according to user's locale and timezone
 */
export function formatDateForUser(
  date: Date,
  locale: string = 'id-ID',
  timezone: string = 'Asia/Jakarta'
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: timezone,
  }).format(date);
}

/**
 * Format currency according to user's locale and currency preference
 */
export function formatCurrencyForUser(
  amount: number,
  currency: string = 'IDR',
  locale: string = 'id-ID'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Get user's greeting based on locale
 */
export function getGreetingForLocale(locale: string, firstName?: string): string {
  const greetings: Record<string, string> = {
    'id-ID': 'Halo',
    'en-US': 'Hello',
    'en-GB': 'Hello',
    'en-AU': 'G\'day',
    'es-ES': 'Hola',
    'fr-FR': 'Bonjour',
    'de-DE': 'Hallo',
    'it-IT': 'Ciao',
    'ja-JP': 'こんにちは',
    'ko-KR': '안녕하세요',
    'zh-CN': '你好',
    'ar-SA': 'مرحبا',
  };

  const greeting = greetings[locale] || greetings['id-ID'];
  return firstName ? `${greeting}, ${firstName}!` : `${greeting}!`;
}
