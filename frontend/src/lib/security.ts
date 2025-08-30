'use client';

/**
 * Security utilities for the Permoney application
 * Implements comprehensive security measures for client-side operations
 */

// Content Security Policy helpers
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'https://api.permoney.app'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
} as const;

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate URLs
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

// Secure localStorage wrapper with encryption simulation
export class SecureStorage {
  private static encode(value: string): string {
    // In production, use proper encryption
    return btoa(encodeURIComponent(value));
  }

  private static decode(value: string): string {
    try {
      return decodeURIComponent(atob(value));
    } catch {
      return '';
    }
  }

  static setItem(key: string, value: string): void {
    try {
      localStorage.setItem(`permoney_${key}`, this.encode(value));
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  }

  static getItem(key: string): string | null {
    try {
      const item = localStorage.getItem(`permoney_${key}`);
      return item ? this.decode(item) : null;
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(`permoney_${key}`);
    } catch (error) {
      console.error('Failed to remove data securely:', error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('permoney_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }
}

// Rate limiting for API calls
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();

  static isAllowed(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  static reset(key: string): void {
    this.requests.delete(key);
  }
}

// Secure random ID generation
export function generateSecureId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without crypto
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Privacy-aware data masking
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const visible = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + visible;
}

// Secure comparison to prevent timing attacks
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// XSS prevention helpers
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate financial amounts
export function validateAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && isFinite(num) && num >= 0 && num <= 999999999999;
}

// Session security
export class SessionSecurity {
  private static readonly SESSION_KEY = 'session_data';
  private static readonly ACTIVITY_KEY = 'last_activity';
  private static readonly MAX_IDLE_TIME = 30 * 60 * 1000; // 30 minutes

  static updateActivity(): void {
    SecureStorage.setItem(this.ACTIVITY_KEY, Date.now().toString());
  }

  static isSessionValid(): boolean {
    const lastActivity = SecureStorage.getItem(this.ACTIVITY_KEY);
    if (!lastActivity) return false;

    const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
    return timeSinceActivity < this.MAX_IDLE_TIME;
  }

  static invalidateSession(): void {
    SecureStorage.removeItem(this.SESSION_KEY);
    SecureStorage.removeItem(this.ACTIVITY_KEY);
  }
}

// Device fingerprinting for security
export function getDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}
