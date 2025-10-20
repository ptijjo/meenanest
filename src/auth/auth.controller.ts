/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Body, Controller, Get, Headers, HttpException, HttpStatus, InternalServerErrorException, Ip, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/users/interface/users.interface';
import { CreateUserDto } from 'src/users/dto/users.dto';
import { UsersService } from 'src/users/users.service';
import { TwofactorService } from 'src/twofactor/twofactor.service';
import { CreateAuthDto } from './dto/auth.dto';
import express from 'express';
import type { RequestWithUser } from './interface/auth.interface';
import { RedisService } from 'src/redis/redis.service';
import { AuthGuard } from './guards/auth.guard';

@Controller('')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly doubleFa: TwofactorService,
    private readonly cacheRedis: RedisService,
  ) {}

  @Post('/signup')
  async signUp(@Body() authData: CreateUserDto) {
    try {
      const signUserData: User = await this.authService.signUp(authData);

      return signUserData;
    } catch (error) {
      console.error(error);
    }
  }

  @Get('/verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    const result = await this.authService.verifyEmail(token);

    return result;
  }

  @Post('/login')
  async login(
    @Body() userData: CreateAuthDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    try {
      const result = await this.authService.login(userData, ipAddress, userAgent);

      // 🔐 Cas : 2FA activé → on attend le code
      if (result.code) {
        return {
          message: 'Double authentification requise',
          tempToken: result.code,
        };
      }

      res.setHeader('Set-Cookie', [result.cookie]);
      return { data: result.accessToken, message: 'login' };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('/login2fa')
  async login2FA(
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Body() userData: { code: string; tempToken: string },
    @Res({ passthrough: true }) res: express.Response,
  ) {
    try {
      const result = await this.authService.loginWith2FA(userData.code, userData.tempToken, ipAddress, userAgent);

      res.setHeader('Set-Cookie', [result.cookie]);
      return { data: result.accessToken, message: 'login' };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('/verify2FA')
  async verify2FA(@Body() code: string, @Req() req: RequestWithUser) {
    try {
      const result = await this.doubleFa.verifyCode(req.user.id, code);
      return result;
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('/logOut')
  async logout(@Req() req: RequestWithUser, @Res({ passthrough: true }) res: express.Response) {
    try {
      const refreshToken: string = req.cookies?.refreshToken;
      if (!refreshToken) throw new HttpException('No refresh token provided', HttpStatus.BAD_REQUEST);
      const { revoked, id } = await this.authService.logout(refreshToken);

      //Suppression ciblée dans Redis
      await this.cacheRedis.del(`auth:${id}`);

      // Supprimer les cookies
      res.setHeader('Set-Cookie', [
        'Authorization=; Max-age=0; HttpOnly; Secure; SameSite=Strict',
        'refreshToken=; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
      ]);
      return { message: 'user logout sucessfully' };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('/logOutAll')
  async logoutAll(@Req() req: RequestWithUser, @Res({ passthrough: true }) res: express.Response) {
    try {
      const id = req.user.id;
      const revoked = await this.authService.logoutAllSessions(id);

      res.setHeader('Set-Cookie', [
        'Authorization=; Max-Age=0; HttpOnly; Secure; SameSite=Strict',

        'RefreshToken=; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
      ]);

      return {
        message: `All sessions revoked successfully`,
        revokedCount: revoked.revokedCount,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @UseGuards(AuthGuard)
  @Get('/connected')
  async whoIsLog(@Req() req: RequestWithUser) {
    if (!req.user || !req.user.id) {
      return { message: 'Unauthorized: no valid token' };
    }
    const userId = req.user.id;
    const cacheKey = `auth:${userId}`;
    try {
      // 1. Essayer de récupérer le profil complet du cache
      const cachedUser = await this.cacheRedis.get(cacheKey);

      if (cachedUser) {
        return { data: cachedUser }; // Cache Hit : Retour immédiat
      }

      // 2. Cache Miss : Aller chercher dans la DB
      const user: User = await this.userService.findUserById(req.user.id);

      if (user) {
        // 3. Mettre à jour le cache et retourner
        await this.cacheRedis.set(cacheKey, user, 3600);
        return { data: user };
      }

      return { message: 'Utilisateur non trouvé' };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('/refresh')
  async refreshToken(
    @Req() req: RequestWithUser,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    try {
      const oldRefreshToken: string | null = req.cookies.refreshToken;
      if (!oldRefreshToken) {
        throw new HttpException('', HttpStatus.UNAUTHORIZED);
      }
      // 🧠 Appel au service
      const { cookie, accessToken } = await this.authService.refreshToken(oldRefreshToken, ipAddress, userAgent);

      // 🍪 Nouveau cookie avec le refresh token
      res.setHeader('Set-Cookie', [cookie]);

      // 📤 Renvoi du nouvel access token (le front Redux va le stocker)
      return { accessToken };
    } catch (error: any) {
      console.error('Erreur refresh :', error);

      if (error instanceof HttpException) {
        throw error; // on relaie directement l'erreur
      }

      throw new InternalServerErrorException('Erreur lors du refresh token');
    }
  }
}
