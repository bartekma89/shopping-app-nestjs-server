import { Injectable } from '@nestjs/common';
import { TCreateUsersDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  createUsers(body: TCreateUsersDto) {
    return body;
  }
}
