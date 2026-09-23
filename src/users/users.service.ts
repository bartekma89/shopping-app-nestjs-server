import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { type CredentialsDto } from '../dtos/users.dto';
import { PrismaService } from '../prisma/prisma.service';
import { hash } from 'argon2';
import { Prisma, User } from '../generated/prisma/client';
import type { PublicUser } from '../auth/types';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(data: CredentialsDto): Promise<PublicUser> {
    try {
      return await this.prismaService.user.create({
        data: {
          ...data,
          password: await hash(data.password),
        },
        select: {
          id: true,
          email: true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UnprocessableEntityException({
          message: 'Validation failed',
          errors: { email: ['Email already exists.'] },
        });
      }

      throw error;
    }
  }

  async findOne(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(id: number): Promise<PublicUser | null> {
    return this.prismaService.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
      },
    });
  }
}
