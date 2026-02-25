import { Controller, Post, Body, HttpException, HttpStatus, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private baseResponse(success: boolean, message: string, object: any = null, errors?: string[]) {
    return { Success: success, Message: message, Object: object, Errors: errors ?? null };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      const user = await this.authService.register(dto);
      return this.baseResponse(true, 'User created', user);
    } catch (e: any) {
      if (e instanceof ConflictException) {
        throw new HttpException(this.baseResponse(false, e.message ?? 'Conflict', null, [e.message]), HttpStatus.CONFLICT);
      }
      return this.baseResponse(false, e.message ?? 'Error', null, [e.message]);
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      const token = await this.authService.login(dto);
      return this.baseResponse(true, 'Logged in', token);
    } catch (e: any) {
      return this.baseResponse(false, e.message ?? 'Error', null, [e.message]);
    }
  }
}
