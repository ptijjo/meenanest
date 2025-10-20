import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailsService } from 'src/mails/mails.service';
import { CreateAuthDto } from './dto/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let mailService: MailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService, MailsService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailsService>(MailsService);
  });

  it('should define service', () => {
    expect(service).toBeDefined();
  });
  it('should define prisma', () => {
    expect(prisma).toBeDefined();
  });
  it('should define mailService', () => {
    expect(mailService).toBeDefined();
  });

  it('should return a new User', async () => {
    const authData: CreateAuthDto = {
      email: 'test@test.com',
      password: 'Meena2025?',
      secretName: 'baba',
    };
    const result = await service.signUp(authData);
    expect(result).toBe()
  });
});
