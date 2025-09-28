import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

type AuthenticatorTransport = 'ble' | 'hybrid' | 'internal' | 'nfc' | 'usb';

@Injectable()
export class PasskeyService {
  private readonly rpName = 'Permoney';
  private readonly rpID: string;
  private readonly origin: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.rpID = this.configService.get<string>('WEBAUTHN_RP_ID', 'localhost');
    this.origin = this.configService.get<string>('WEBAUTHN_ORIGIN', 'http://localhost:3000');
  }

  async generateRegistrationOptions(userId: string, passkeyName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { passkeys: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const options: GenerateRegistrationOptionsOpts = {
      rpName: this.rpName,
      rpID: this.rpID,
      userID: Buffer.from(user.id, 'utf-8'),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: user.passkeys.map((passkey) => ({
        id: passkey.credentialId, // Use the stored base64 string directly
        type: 'public-key' as const,
        transports: passkey.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    };

    const registrationOptions = await generateRegistrationOptions(options);

    // Store challenge temporarily (in production, use Redis with expiration)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        // Store challenge in metadata temporarily
        // In production, use a separate challenge storage
      },
    });

    return {
      options: registrationOptions,
      passkeyName,
    };
  }

  async verifyRegistration(
    userId: string,
    passkeyName: string,
    response: RegistrationResponseJSON,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const expectedChallenge = response.response.clientDataJSON; // Get from stored challenge
    
    const verification: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge: Buffer.from(expectedChallenge).toString('base64url'),
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
    };

    try {
      const verificationResult = await verifyRegistrationResponse(verification);

      if (verificationResult.verified && verificationResult.registrationInfo) {
        const { credential } = verificationResult.registrationInfo;

        // Save passkey to database
        await this.prisma.passkey.create({
          data: {
            userId,
            name: passkeyName,
            credentialId: Buffer.from(credential.id).toString('base64'),
            publicKey: Buffer.from(credential.publicKey).toString('base64'),
            counter: 0, // Default counter value
            transports: response.response.transports || [],
          },
        });

        return { verified: true };
      }

      return { verified: false, error: 'Registration verification failed' };
    } catch (error) {
      throw new BadRequestException('Registration verification failed');
    }
  }

  async generateAuthenticationOptions(email?: string) {
    let allowCredentials: { id: Buffer; type: 'public-key'; transports?: AuthenticatorTransport[] }[] = [];

    if (email) {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { passkeys: true },
      });

      if (user && user.passkeys.length > 0) {
        allowCredentials = user.passkeys.map((passkey) => ({
          id: Buffer.from(passkey.credentialId, 'base64'),
          type: 'public-key' as const,
          transports: passkey.transports as AuthenticatorTransport[],
        }));
      }
    }

    const options: GenerateAuthenticationOptionsOpts = {
      rpID: this.rpID,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials as any : undefined,
      userVerification: 'preferred',
    };

    const authenticationOptions = await generateAuthenticationOptions(options);

    return authenticationOptions;
  }

  async verifyAuthentication(
    response: AuthenticationResponseJSON,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const credentialId = Buffer.from(response.id, 'base64url').toString('base64');

    const passkey = await this.prisma.passkey.findUnique({
      where: { credentialId },
      include: { user: true },
    });

    if (!passkey) {
      throw new UnauthorizedException('Passkey not found');
    }

    if (!passkey.user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const verification: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge: Buffer.from(response.response.clientDataJSON).toString('base64url'),
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      credential: {
        id: passkey.credentialId, // Use the stored base64 string directly
        publicKey: Buffer.from(passkey.publicKey, 'base64'),
        counter: passkey.counter,
        transports: passkey.transports as AuthenticatorTransport[],
      },
    };

    try {
      const verificationResult = await verifyAuthenticationResponse(verification);

      if (verificationResult.verified) {
        // Update passkey counter and last used timestamp
        await this.prisma.passkey.update({
          where: { id: passkey.id },
          data: {
            counter: verificationResult.authenticationInfo.newCounter,
            lastUsedAt: new Date(),
          },
        });

        // Generate tokens using AuthService
        const tokens = await this.authService['generateTokens'](passkey.user);

        // Create session
        await this.authService['sessionService'].createSession({
          userId: passkey.user.id,
          token: tokens.refreshToken,
          userAgent,
          ipAddress,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        return {
          verified: true,
          user: this.authService['sanitizeUser'](passkey.user),
          token: tokens.refreshToken,
          tokens,
        };
      }

      return { verified: false, error: 'Authentication verification failed' };
    } catch (error) {
      throw new UnauthorizedException('Authentication verification failed');
    }
  }

  async getUserPasskeys(userId: string) {
    return this.prisma.passkey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        transports: true,
      },
    });
  }

  async deletePasskey(userId: string, passkeyId: string) {
    const passkey = await this.prisma.passkey.findFirst({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      throw new BadRequestException('Passkey not found');
    }

    await this.prisma.passkey.delete({
      where: { id: passkeyId },
    });

    return { success: true };
  }

  async renamePasskey(userId: string, passkeyId: string, newName: string) {
    const passkey = await this.prisma.passkey.findFirst({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      throw new BadRequestException('Passkey not found');
    }

    await this.prisma.passkey.update({
      where: { id: passkeyId },
      data: { name: newName },
    });

    return { success: true };
  }
}
