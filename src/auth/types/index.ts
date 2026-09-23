import { User } from '../../generated/prisma/client';

export type TokenPayload = {
  sub: number;
};

export type PublicUser = Pick<User, 'id' | 'email'>;
