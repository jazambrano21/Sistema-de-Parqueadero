import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { HttpClientService } from './common/http-client.service';
import { Ticket } from './entities/ticket.entity';

import { RolesGuard } from '../auth/roles.guard';
import { EventPublisherService } from '../common/event-publisher.service';
import { CacheService } from '../common/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
    ]),

    CacheModule.registerAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: async (
        configService: ConfigService,
      ) => ({
        store: await redisStore({
          socket: {
            host:
              configService.get<string>(
                'REDIS_HOST',
              ) || 'localhost',

            port: Number(
              configService.get<string>(
                'REDIS_PORT',
              ) || 6379,
            ),
          },

          ttl: 300,
        }),
      }),
    }),
  ],

  controllers: [
    TicketsController,
  ],

  providers: [
    TicketsService,
    HttpClientService,
    RolesGuard,
    EventPublisherService,
    CacheService,
  ],
})
export class TicketsModule {}