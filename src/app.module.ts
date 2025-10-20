import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailsService } from './mails/mails.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.TIME_LOCK),
        limit: Number(process.env.NUMBER_OF_FAIL_BEFORE_LOCK),
      },
    ]),
    AuthModule,
    UsersModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailsService],
})
export class AppModule {}
