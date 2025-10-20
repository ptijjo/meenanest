/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TwofactorService } from 'src/twofactor/twofactor.service';
import { User } from './interface/users.interface';
import { UpdateUserDto } from './dto/users.dto';
import { hash } from 'bcrypt';
import path from 'path';
import { RedisService } from 'src/redis/redis.service';
import safeDelete from 'src/utils/safeDeleteFilePath';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doubleFa: TwofactorService,
    private readonly cacheRedis: RedisService,
  ) {}

  public async findAllUser(): Promise<User[]> {
    let allUser: User[] = await this.prisma.user.findMany({
      include: {
        Session: {
          where: {
            isRevoked: false,
          },
        },
        UserSecret: true,
      },
    });

    if (allUser === null) allUser = [];

    return allUser;
  }

  public async findUserById(userId: string): Promise<User> {
    const findUser: User | null = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException("User doesn't exist", HttpStatus.CONFLICT);
    return findUser;
  }

  public async updateUser(userId: string, userData: UpdateUserDto): Promise<{ updateUserData: User; qrCodeUrl?: string }> {
    let qrCodeUrl: string | undefined;

    const findUser: User | null = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException("User doesn't exist", HttpStatus.CONFLICT);

    const updatedUserData = { ...userData };

    // Gestion du rôle
    if (userData.role) {
      if (userData.role !== 'admin') {
        throw new HttpException('Authorisation admin requise', HttpStatus.CONFLICT);
      }
      updatedUserData.role = userData.role;
    }

    // Hachage du mot de passe s'il est mis à jour
    if (userData.password) {
      updatedUserData.password = await hash(userData.password, 10);
    }

    // Gestion de l'avatar
    if (userData.avatar && findUser.avatar && userData.avatar !== findUser.avatar) {
      try {
        const oldUrl = new URL(findUser.avatar);

        // Si le fichier est hébergé sur ton propre serveur (localhost ou ton domaine)
        if (oldUrl.hostname === 'localhost' || oldUrl.hostname === '127.0.0.1' || oldUrl.hostname === 'api.meena.cellulenoire.fr') {
          const filePath = path.join(__dirname, '..', '..', oldUrl.pathname);

          console.log("🗑️ Suppression de l'ancien avatar :", filePath);
          await safeDelete(filePath);
        } else {
          console.log('🌍 Ancien avatar hébergé à distance, suppression ignorée.');
        }
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.warn(`⚠️ Fichier introuvable : ${err.path}`);
        } else {
          console.error("❌ Erreur lors de la suppression de l'ancien avatar :", err);
          throw new HttpException(`Erreur lors de la suppression de l'ancien avatar : ${err}`, HttpStatus.CONFLICT);
        }
      }
    }

    //Activation du double facteur
    if (userData.is2FaEnable && !findUser.is2FaEnable) {
      qrCodeUrl = (await this.doubleFa.generateSecret(findUser.id)).qrCodeUrl;
    }

    // Désactivation du 2FA
    if (userData.is2FaEnable === false && findUser.is2FaEnable) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          is2FaEnable: false,
          twoFaSecret: null,
        },
      });
    }

    if (typeof userData.avatar !== 'string') {
      delete userData.avatar; // Évite d'envoyer un objet
    }

    const updateUserData = await this.prisma.user.update({ where: { id: userId }, data: { ...userData } });
    await this.cacheRedis.del(`user:${userId}`);
    return { updateUserData, qrCodeUrl };
  }

  public async deleteUser(userId: string, authUser: { id: string; role: string }): Promise<User> {
    const findUser: User | null = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException("User doesn't exist", HttpStatus.CONFLICT);

    if (authUser.id !== userId && authUser.role === String(Role.user)) {
      throw new HttpException('Not authorized to delete this user', HttpStatus.FORBIDDEN);
    }

    const deleteUserData = await this.prisma.user.delete({ where: { id: userId } });
    return deleteUserData;
  }
}
