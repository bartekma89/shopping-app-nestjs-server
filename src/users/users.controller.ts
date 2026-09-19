import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { type CredentialsDto, credentialSchema } from '../dtos/users.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // it can be use if the data would be a formData type
  // @UseInterceptors(NoFilesInterceptor())
  @Post()
  createUsers(
    @Body(new ZodValidationPipe(credentialSchema)) body: CredentialsDto,
  ) {
    return this.userService.createUsers(body);
  }
}
