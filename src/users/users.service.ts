import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { TCreateUsersDto } from './dto/user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { hash } from 'argon2';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUsers(data: TCreateUsersDto) {
    try {
      return await this.prismaService.user.create({
        data: {
          ...data,
          password: await hash(data.password),
        },
        select: {
          email: true,
          id: true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UnprocessableEntityException('Email already exists.');
      }

      throw error;
    }
  }
}
