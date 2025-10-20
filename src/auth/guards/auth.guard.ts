/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { User } from 'src/users/interface/users.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { DataStoredInToken, RequestWithUser } from '../interface/auth.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token: string = this.extractTokenFromRequest(request) as string;

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // 1. Décode le JWT pour obtenir l'ID (cela gère les erreurs de signature/expiration)
      const decoded = verify(token, process.env.SECRET_KEY as string) as DataStoredInToken;
      const userId = decoded.id;

      // 2. Nouvelle clé de cache : basée sur l'ID utilisateur
      // Note: Utiliser 'auth:' ou 'user:' est une convention. 'user:' est très clair.
      const cacheKey = `user:${userId}`;

      // 3. Cherche d'abord l'utilisateur dans Redis
      const cachedUser: User | null = await this.redisService.get(cacheKey);

      if (cachedUser) {
        request.user = cachedUser;
        return true;
      }

      // 4. Récupère l'utilisateur depuis la DB
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('User not found');

      // 5. Met l'utilisateur en cache
      await this.redisService.set(cacheKey, user, Number(process.env.ACCESS_TOKEN_EXPIRES_IN));

      request.user = user;
      return true;
    } catch (error: any) {
      console.error('JWT error:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromRequest(request: RequestWithUser): string | null {
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split('Bearer ')[1];
    }

    // Optionnel : support des cookies
    if (request.cookies?.refreshToken) {
      return request.cookies.refreshToken as string;
    }

    return null;
  }
}
