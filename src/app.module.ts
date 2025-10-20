/* eslint-disable @typescript-eslint/no-unused-vars */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailsService } from './mails/mails.service';
import { TwofactorService } from './twofactor/twofactor.service';
import { RedisModule } from './redis/redis.module';
import { CsrfMiddleware } from './middleware/csrf.middleware';

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
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailsService, TwofactorService],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    // consumer.apply(CsrfMiddleware).forRoutes('*'); // ✅ Middleware appliqué proprement
  }
}
