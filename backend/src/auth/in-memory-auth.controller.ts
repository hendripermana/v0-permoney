import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Req, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { InMemoryAuthService } from './services/in-memory-auth.service';
import { InMemoryJwtAuthGuard } from './in-memory-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { 
  RegisterDto, 
  LoginDto, 
  RefreshTokenDto, 
  AuthResponseDto
} from './dto/auth.dto';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class InMemoryAuthController {
  constructor(private readonly authService: InMemoryAuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: any
  ): Promise<AuthResponseDto> {
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.ip || request.connection.remoteAddress;
    
    return this.authService.register(registerDto, userAgent, ipAddress);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: any
  ): Promise<AuthResponseDto> {
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.ip || request.connection.remoteAddress;
    
    return this.authService.login(loginDto, userAgent, ipAddress);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(InMemoryJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: any): Promise<{ success: boolean; message: string }> {
    return this.authService.logout(request.sessionId);
  }

  @Get('me')
  @UseGuards(InMemoryJwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'in-memory-auth-service'
    };
  }
}
