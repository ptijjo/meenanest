/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as jwt from 'jsonwebtoken';
import { DataStoredInToken, TokenData } from 'src/auth/interface/auth.interface';
import { User } from 'src/users/interface/users.interface';
import { v4 as uuidv4 } from 'uuid';

export interface RefreshTokenData {
  jti: string;
  token: string;
  expiresIn: number;
}

export const createAccessToken = (user: User): TokenData => {
  const dataStoredInToken: DataStoredInToken = { id: user.id };
  const secretKey: string = process.env.SECRET_KEY as string;
  const expiresIn: number = Number(process.env.ACCESS_TOKEN_EXPIRES_IN);

  return { expiresIn, token: jwt.sign(dataStoredInToken, secretKey, { expiresIn }) };
};

export const createRefreshToken = (user: User): RefreshTokenData => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const jti = uuidv4();
  const payload = { id: user.id, jti };
  const secret = process.env.REFRESH_TOKEN_SECRET as string;
  const expiresIn = Number(process.env.REFRESH_TOKEN_EXPIRES_IN);
  return {
    jti,
    expiresIn,
    token: jwt.sign(payload, secret, { expiresIn }),
  };
};

export const createCookie = (refreshTokenData: RefreshTokenData): string => {
  return `refreshToken=${refreshTokenData.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${refreshTokenData.expiresIn}`;
};
