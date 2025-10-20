/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuthDto } from './dto/auth.dto';
import { User } from 'src/users/interface/users.interface';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { generateId } from 'src/utils/generateId';
import { MailsService } from 'src/mails/mails.service';

@Injectable()
export class AuthService {
  private EXPIRES_TOKEN_VERIFICATION_EMAIL =
    process.env.EXPIRES_TOKEN_VERIFICATION_EMAIL;
  private VERIFICATION_EMAIL_LINK = process.env.VERIFICATION_EMAIL_LINK;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailsService,
  ) {}

  signUp = async (authData: CreateAuthDto): Promise<User> => {
    // 1️⃣ Vérifie si l'utilisateur existe déjà
    const findUser: User | null = await this.prisma.user.findUnique({
      where: { email: authData.email },
    });

    if (findUser) {
      throw new Error(`This email ${authData.email} already exists`);
    }

    // 2️⃣ Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(authData.password as string, 10);

    // 3️⃣ Générer un token de vérification unique
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(
      Date.now() + Number(this.EXPIRES_TOKEN_VERIFICATION_EMAIL),
    ); // 48h

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
    console.log(
      `📧 Lien de vérification envoyé à ${createUserData.email} : ${verificationLink}`,
    );

    await this.mailService.sendEmailVerification(
      createUserData.email,
      verificationLink,
    );

    return createUserData;
  };
}
