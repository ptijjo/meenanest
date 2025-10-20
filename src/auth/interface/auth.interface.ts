import { Request } from 'express';
import { User } from 'src/users/interface/users.interface';

export interface DataStoredInToken {
  id: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: User;
  jti: string;
  logIn: any;
  isAuthenticated?: any;
  refreshToken: string;
  file: File;
}
