/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuthDto } from './dto/auth.dto';
import { User } from 'src/users/interface/users.interface';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { generateId } from 'src/utils/generateId';
import { MailsService } from 'src/mails/mails.service';
import { CreateUserDto } from 'src/users/dto/users.dto';
import { createAccessToken, createCookie, createRefreshToken, RefreshTokenData } from 'src/utils/tokens';
import { sign, verify } from 'jsonwebtoken';
import { TwofactorService } from 'src/twofactor/twofactor.service';

@Injectable()
export class AuthService {
  private EXPIRES_TOKEN_VERIFICATION_EMAIL = process.env.EXPIRES_TOKEN_VERIFICATION_EMAIL;
  private VERIFICATION_EMAIL_LINK = process.env.VERIFICATION_EMAIL_LINK;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailsService,
    private readonly doubleFa: TwofactorService,
  ) {}

  public signUp = async (authData: CreateUserDto): Promise<User> => {
    // 1️⃣ Vérifie si l'utilisateur existe déjà
    const findUser: User | null = await this.prisma.user.findUnique({
      where: { email: authData.email },
    });

    if (findUser) {
      throw new HttpException(`This email ${authData.email} already exists`, HttpStatus.FORBIDDEN);
    }

    // 2️⃣ Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(authData.password as string, 10);

    // 3️⃣ Générer un token de vérification unique
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + Number(this.EXPIRES_TOKEN_VERIFICATION_EMAIL)); // 48h

    // 4️⃣ Créer l'utilisateur non vérifié

    const createUserData: User = await this.prisma.user.create({
      data: {
        ...authData,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        verificationExpiresAt,
      },
    });

    // 5️⃣ Créer le secret associé

    await this.prisma.userSecret.create({
      data: {
        name: createUserData.secretName,
        user: { connect: { id: createUserData.id } },
        invitId: generateId(9),
      },
    });

    // 6️⃣ Envoi de l'email de vérification (mock pour le moment)

    const verificationLink = `${this.VERIFICATION_EMAIL_LINK}${verificationToken}`;
    console.log(`📧 Lien de vérification envoyé à ${createUserData.email} : ${verificationLink}`);

    await this.mailService.sendEmailVerification(createUserData.email, verificationLink);

    return createUserData;
  };

  public verifyEmail = async (token: string): Promise<User> => {
    // 1️⃣ Trouver l'utilisateur avec ce token
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });
    if (!user) {
      throw new HttpException('Lien de vérification invalide', HttpStatus.BAD_REQUEST);
    }
    if (user.isVerified) {
      throw new HttpException('Ce compte est déjà vérifié', HttpStatus.BAD_REQUEST);
    }
    if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
      // Supprimer le compte expiré
      await this.prisma.user.delete({ where: { id: user.id } });
      throw new HttpException('Le lien a expiré, veuillez vous réinscrire', HttpStatus.GONE);
    }
    // 2️⃣ Activer le compte
    const verifiedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpiresAt: null,
      },
    });

    return verifiedUser;
  };

  private async finalizeLogin(user: User, ipAddress: string, userAgent: string): Promise<{ cookie: string; findUser: User; accessToken: string }> {
    // 1️⃣ Vérifier une session existante
    const existingSession = await this.prisma.session.findFirst({
      where: {
        userId: user.id,
        ipAddress,
        userAgent,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2️⃣ Créer ou renouveler la session
    let refreshTokenData;
    if (existingSession) {
      refreshTokenData = createRefreshToken(user);
      await this.prisma.session.update({
        where: { id: existingSession.id },
        data: {
          jti: refreshTokenData.jti,
          expiresAt: new Date(Date.now() + refreshTokenData.expiresIn * 1000),
        },
      });
    } else {
      // Vérifie le nombre de sessions actives
      const activeSessionsCount = await this.prisma.session.count({
        where: {
          userId: user.id,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (activeSessionsCount >= Number(process.env.MAX_ACTIVE_SESSIONS)) {
        throw new HttpException(`La limite de ${process.env.MAX_ACTIVE_SESSIONS} sessions actives est atteinte.`, HttpStatus.FORBIDDEN);
      }

      // Crée une nouvelle session
      refreshTokenData = createRefreshToken(user);

      await this.prisma.session.create({
        data: {
          user: { connect: { id: user.id } },
          jti: refreshTokenData.jti,
          userAgent,
          ipAddress,
          expiresAt: new Date(Date.now() + refreshTokenData.expiresIn * 1000),
        },
      });
    }

    // 3️⃣ Révoquer les sessions expirées
    await this.prisma.session.updateMany({
      where: { expiresAt: { lt: new Date() }, isRevoked: false },
      data: { isRevoked: true },
    });

    // 4️⃣ Créer tokens + cookie
    const accessTokenData = createAccessToken(user);
    const cookie = createCookie(refreshTokenData);

    // 5️⃣ Historiser la connexion
    await this.prisma.loginHistory.create({
      data: { user: { connect: { id: user.id } } },
    });

    return { cookie, findUser: user, accessToken: accessTokenData.token };
  }

  public login = async (
    userData: CreateAuthDto,
    ipAddressData: string,
    userAgentData: string,
  ): Promise<{ cookie: string; findUser: User; accessToken: string; code?: string }> => {
    //GoogleId present
    if (userData.googleId) {
      let findUser: User | null = await this.prisma.user.findUnique({ where: { googleId: userData.googleId } });

      // Vérifier s'il existe déjà un utilisateur avec le même email
      const existingByEmail = await this.prisma.user.findUnique({ where: { email: userData.email } });

      if (existingByEmail) {
        // On associe le googleId au compte existant
        findUser = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: userData.googleId },
        });
      }

      // Si pas d'utilisateur → on le crée à la volée
      if (!findUser) {
        //on cré un user dans la bdd avec l'email + googleId et le le connecte
        findUser = await this.prisma.user.create({
          data: {
            email: userData.email,
            googleId: userData.googleId,
            secretName: `user` + generateId(7),
            isVerified: true,
          },
        });

        await this.prisma.userSecret.create({
          data: {
            name: findUser.secretName,
            user: { connect: { id: findUser.id } },
            invitId: generateId(9),
          },
        });
      }

      // Vérifier une session existante (même IP + User-Agent)
      const existingSession = await this.prisma.session.findFirst({
        where: {
          userId: findUser.id,
          ipAddress: ipAddressData,
          userAgent: userAgentData,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      // refreshTokenData sera défini dans les deux cas
      let refreshTokenData: RefreshTokenData;
      if (existingSession) {
        // Renouveler : créer un nouveau refresh token (JWT avec jti)
        refreshTokenData = createRefreshToken(findUser);

        await this.prisma.session.update({
          where: { id: existingSession.id },
          data: {
            jti: refreshTokenData.jti,
            expiresAt: new Date(Date.now() + refreshTokenData.expiresIn * 1000),
          },
        });
      } else {
        // Vérifier le nombre de sessions actives
        const activeSessionsCount = await this.prisma.session.count({
          where: { userId: findUser.id, isRevoked: false, expiresAt: { gt: new Date() } },
        });

        if (activeSessionsCount >= Number(process.env.MAX_ACTIVE_SESSIONS)) {
          throw new HttpException(
            `La limite de ${process.env.MAX_ACTIVE_SESSIONS} sessions actives est atteinte. Veuillez en fermer une avant de vous reconnecter.`,
            HttpStatus.FORBIDDEN,
          );
        }

        // Créer une nouvelle session (avec jti)
        refreshTokenData = createRefreshToken(findUser);

        await this.prisma.session.create({
          data: {
            user: { connect: { id: findUser.id } },
            jti: refreshTokenData.jti,
            userAgent: userAgentData,
            ipAddress: ipAddressData,
            expiresAt: new Date(Date.now() + refreshTokenData.expiresIn * 1000),
          },
        });
      }

      // Révoquer les sessions expirées
      await this.prisma.session.updateMany({
        where: { expiresAt: { lt: new Date() }, isRevoked: false },
        data: { isRevoked: true },
      });

      // Générer l'access token (une seule fois)
      const accessTokenData = createAccessToken(findUser);

      // Créer le cookie HTTPOnly (avec le refresh token JWT)
      const cookie = createCookie(refreshTokenData);

      // Historiser la connexion (une seule fois)
      await this.prisma.loginHistory.create({
        data: { user: { connect: { id: findUser.id } } },
      });

      return { cookie, findUser, accessToken: accessTokenData.token };
    }

    // 1️⃣ Vérifier si l'utilisateur existe
    const findUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (!findUser) throw new HttpException('Identifiants incorrects', HttpStatus.CONFLICT);

    //si il n'a pas encore vérifier son adresse mail il ne pourra pas se connecter
    if (!findUser.isVerified) {
      throw new HttpException('Merci de vérifier votre email avant de vous connecter', HttpStatus.CONFLICT);
    }

    // 2️⃣ Vérifier si le compte est temporairement verrouillé
    if (findUser.lockedUntil && findUser.lockedUntil > new Date()) {
      throw new HttpException(`Compte temporairement verrouillé jusqu'à ${findUser.lockedUntil}`, HttpStatus.CONFLICT);
    }

    // 3️⃣ Vérifier le mot de passe
    const isPasswordMatching = await bcrypt.compare(userData.password as string, findUser.password as string);
    const success = isPasswordMatching;

    // 5️⃣ Gestion des échecs
    if (!success) {
      await this.prisma.loginAttempts.create({
        data: {
          ipAddress: ipAddressData,
          email: { connect: { email: findUser.email } },
          success: false,
        },
      });

      let failed = findUser.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (failed >= Number(process.env.NUMBER_OF_FAIL_BEFORE_LOCK)) {
        lockedUntil = new Date(Date.now() + Number(process.env.TIME_LOCK)); // verrouillage 30 min
        failed = 0;
      }

      await this.prisma.user.update({
        where: { email: findUser.email },
        data: { failedLoginAttempts: failed, lockedUntil },
      });

      throw new HttpException('Identifiants incorrects', HttpStatus.UNAUTHORIZED);
    }

    // 6️⃣ Réinitialiser les échecs
    await this.prisma.user.update({
      where: { email: findUser.email },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    //si double FA activée
    if (findUser.is2FaEnable) {
      // Créer un token temporaire (JWT 5 min)
      const code = sign({ userId: findUser.id }, String(process.env.TWO_FA_SECRET_KEY), { expiresIn: '5m' });
      return { cookie: '', findUser, accessToken: '', code };
    }

    return await this.finalizeLogin(findUser, ipAddressData, userAgentData);
  };

  public async loginWith2FA(code: string, tempToken: string, ipAddress: string, userAgent: string) {
    const decoded = verify(tempToken, String(process.env.TWO_FA_SECRET_KEY)) as { userId: string };
    const userId = decoded.userId;

    const user = await this.doubleFa.verifyLoginCode(userId, code);

    // ✅ Code valide → on termine le login
    return await this.finalizeLogin(user, ipAddress, userAgent);
  }

  public async refreshToken(oldRefreshToken: string, ipAddress: string, userAgent: string): Promise<{ cookie: string; accessToken: string }> {
    let decoded: any;
    try {
      decoded = verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET as string);
    } catch (err) {
      throw new HttpException('Refresh token invalide', HttpStatus.UNAUTHORIZED);
    }

    // 1️⃣ Rechercher la session via la JTI (et user)
    const session = await this.prisma.session.findUnique({
      where: { jti: decoded.jti },
      include: { user: true },
    });

    if (!session || session.isRevoked) {
      throw new HttpException('Session invalide ou révoquée', HttpStatus.UNAUTHORIZED);
    }

    // 2️⃣ Vérifier l'expiration
    if (session.expiresAt < new Date()) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      throw new HttpException('Session expirée, veuillez vous reconnecter', HttpStatus.UNAUTHORIZED);
    }

    const user = session.user;

    // 4️⃣ Générer un NOUVEAU access token + refresh token
    const newAccessTokenData = createAccessToken(user);
    const newRefreshTokenData = createRefreshToken(user);

    // 5️⃣ Mettre à jour la session avec le NOUVEAU Jti
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        jti: newRefreshTokenData.jti,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + newRefreshTokenData.expiresIn * 1000),
      },
    });

    // 6️⃣ Créer un cookie HTTPOnly avec le nouveau refresh token
    const cookie = createCookie(newRefreshTokenData);

    return {
      cookie,
      accessToken: newAccessTokenData.token,
    };
  }

  public async logout(refreshToken: string): Promise<{ revoked: boolean; id: string }> {
    try {
      // 1️⃣ Vérifier que le token existe
      if (!refreshToken) throw new HttpException('No refresh token provided', HttpStatus.BAD_REQUEST);

      // 2️⃣ Vérifier la validité du token
      const decoded = verify(refreshToken, String(process.env.REFRESH_TOKEN_SECRET)) as { id: string; jti: string };
      if (!decoded || !decoded.jti) throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);

      // 3️⃣ Trouver la session correspondante
      const session = await this.prisma.session.findUnique({
        where: { jti: decoded.jti },
      });

      if (!session) throw new HttpException('Session not found', HttpStatus.NOT_FOUND);

      // 4️⃣ Révoquer la session
      await this.prisma.session.update({
        where: { jti: decoded.jti },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      return { revoked: true, id: decoded.id };
    } catch (error) {
      throw new HttpException('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  public async logoutAllSessions(userId: string): Promise<{ revokedCount: number }> {
    const findUser = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!findUser) throw new HttpException("User doesn't exist", HttpStatus.NOT_FOUND);

    // 2️⃣ Révoque toutes les sessions actives (non révoquées)
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    return { revokedCount: result.count };
  }
}
