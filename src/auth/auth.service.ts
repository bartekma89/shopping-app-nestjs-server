import { type Response } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PublicUser, TokenPayload } from './types';
import { ACCESS_COOKIE } from '../constants';

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
  ): Promise<PublicUser> {
    const user = await this.usersService.findOne(email);

    if (!user || !(await argon.verify(user.password, password))) {
      throw new UnauthorizedException('Credentials are not valid');
    }

    const payload: TokenPayload = { sub: user.id };

    const token = this.jwtService.sign(payload);

    res.cookie(ACCESS_COOKIE, token, {
      expires: new Date(
        Date.now() +
          Number(this.configService.getOrThrow<string>('JWT_EXPIRATION_MS')),
      ),
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
    });

    return { id: user.id, email: user.email };
  }
}
