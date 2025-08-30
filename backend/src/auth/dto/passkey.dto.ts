import { IsString, IsNotEmpty, IsObject } from 'class-validator';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/types';

export class PasskeyRegistrationDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class PasskeyVerificationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  response: RegistrationResponseJSON;
}

export class PasskeyAuthenticationDto {
  @IsObject()
  @IsNotEmpty()
  response: AuthenticationResponseJSON;
}
