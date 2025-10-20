import { Method2Fa, Role, UserStatus } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  password: string | null;
  secretName: string;
  phone: string | null;
  phoneVerified: boolean;
  googleId: string | null;
  role: Role;
  status: UserStatus;
  avatar: string;
  is2FaEnable: boolean;
  twoFaSecret: string | null;
  twoFaMethod: Method2Fa;
  twoFaVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  isVerified: boolean;
  verificationToken: string | null;
  verificationExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
