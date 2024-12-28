import { Module, Global } from '@nestjs/common';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: config.get<string>('REDIS_HOST'),
            port: config.get<number>('REDIS_PORT'),
          },
          password: config.get<string>('REDIS_PASSWORD'),
        });

        return {
          store: store as unknown as CacheStore,
        };
      },
    }),
  ],
  exports: [CacheModule, RedisService],
  providers: [RedisService],
})
export class RedisModule {}
