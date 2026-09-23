import type { Response } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { type CredentialsDto, credentialSchema } from '../dtos/users.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  signIn(
    @Body(new ZodValidationPipe(credentialSchema)) user: CredentialsDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(user.email, user.password, res);
  }
}
