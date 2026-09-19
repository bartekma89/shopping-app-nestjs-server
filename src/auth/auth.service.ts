import { type Response } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { User } from '../generated/prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(
    email: string,
    password: string,
    res: Response,
  ): Promise<Pick<User, 'id' | 'email'>> {
    const user = await this.usersService.findOne(email);

    if (!user || !(await argon.verify(user.password, password))) {
      throw new UnauthorizedException('Credentials are not valid');
    }

    const payload = { sub: user.id, email: user.email };

    const token = this.jwtService.sign(payload);

    res.cookie('jwt_token', token, {
      expires: new Date(
        Date.now() +
          Number(this.configService.getOrThrow<string>('JWT_EXPIRATION_MS')),
      ),
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...result } = user;

    return result;
  }
}
