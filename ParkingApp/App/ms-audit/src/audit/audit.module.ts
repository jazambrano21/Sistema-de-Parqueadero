import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditConsumer } from './audit.consumer';
import { EventoAuditoria } from './entities/evento-auditoria.entity';
import { CacheService } from '../common/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventoAuditoria,
    ]),

    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: async (
        configService: ConfigService,
      ) => ({
        store: await redisStore({
          host:
            configService.get<string>('REDIS_HOST') ||
            'localhost',

          port: Number(
            configService.get<string>('REDIS_PORT') ||
              6379,
          ),
        }),

        ttl: 300000,
      }),
    }),
  ],

  controllers: [
    AuditController,
  ],

  providers: [
    AuditService,
    AuditConsumer,
    CacheService,
  ],

  exports: [
    AuditService,
  ],
})
export class AuditModule {}