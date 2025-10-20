import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TwofactorService } from 'src/twofactor/twofactor.service';
import { RedisModule } from 'src/redis/redis.module';
import { RedisService } from 'src/redis/redis.service';

@Module({
  imports: [RedisModule],
  controllers: [UsersController],
  providers: [UsersService, TwofactorService, RedisService],
  exports: [UsersService],
})
export class UsersModule {}
