import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailsService } from 'src/mails/mails.service';
import { TwofactorService } from 'src/twofactor/twofactor.service';
import { RedisModule } from 'src/redis/redis.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [RedisModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, MailsService, TwofactorService],
})
export class AuthModule {}
