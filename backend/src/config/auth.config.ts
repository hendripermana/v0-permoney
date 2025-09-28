import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  jwtSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  sessionSecret: string;
  sessionMaxAge: number;
  passkeyChallengeTimeout: number;
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export default registerAs('auth', (): AuthConfig => {
  // Generate default secrets if not provided
  const generateSecret = (prefix: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${prefix}-${timestamp}-${random}`;
  };

  return {
    jwtSecret: process.env.JWT_SECRET || generateSecret('jwt-secret'),
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    sessionSecret: process.env.SESSION_SECRET || generateSecret('session-secret'),
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours
    passkeyChallengeTimeout: parseInt(process.env.PASSKEY_CHALLENGE_TIMEOUT || '300000', 10), // 5 minutes
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '1800000', 10), // 30 minutes
  };
});
