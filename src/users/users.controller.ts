import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { type CredentialsDto, credentialSchema } from '../dtos/users.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { PublicUser } from '../auth/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // it can be use if the data would be a formData type
  // @UseInterceptors(NoFilesInterceptor())
  @Post()
  createUser(
    @Body(new ZodValidationPipe(credentialSchema)) body: CredentialsDto,
  ) {
    return this.userService.createUser(body);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() currentUser: PublicUser) {
    return currentUser;
  }
}
