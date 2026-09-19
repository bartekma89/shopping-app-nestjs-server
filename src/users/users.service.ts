import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { type CredentialsDto } from '../dtos/users.dto';
import { PrismaService } from '../prisma/prisma.service';
import { hash } from 'argon2';
import { Prisma, User } from '../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUsers(data: CredentialsDto): Promise<Pick<User, 'id' | 'email'>> {
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

  async findOne(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(id: number): Promise<Pick<User, 'id' | 'email'> | null> {
    return this.prismaService.user.findUnique({
      where: {
        id,
      },
      select: {
        email: true,
        id: true,
      },
    });
  }
}
