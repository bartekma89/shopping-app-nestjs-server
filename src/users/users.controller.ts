import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { type TCreateUsersDto, createUsers } from './dto/user.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  createUsers(@Body(new ZodValidationPipe(createUsers)) body: TCreateUsersDto) {
    return this.userService.createUsers(body);
  }
}
