import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  name: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    const accessTokenExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const accessToken = this.jwtService.sign(
      { ...payload, type: 'access' },
      {
        expiresIn: accessTokenExpiresIn,
      }
    );

    const refreshToken = this.jwtService.sign(
      { sub: payload.sub, type: 'refresh' },
      {
        expiresIn: refreshTokenExpiresIn,
      }
    );

    // Convert expiresIn to seconds
    const expiresInSeconds = this.parseExpiresIn(accessTokenExpiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }

  verifyRefreshToken(token: string): { sub: string; type: string } {
    const payload = this.jwtService.verify(token);
    if (payload.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    return payload;
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900; // 15 minutes default
    }
  }
}
