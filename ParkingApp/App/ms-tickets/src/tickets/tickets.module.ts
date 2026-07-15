import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    TypeOrmModule.forFeature([Ticket]),
    // CacheModule importado aquí para que CACHE_MANAGER esté disponible
    // en el contexto de TicketsModule
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get('REDIS_HOST') || 'localhost',
            port: +(config.get('REDIS_PORT') || 6379),
          },
          ttl: 60 * 5, // 5 minutos por defecto
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    HttpClientService,
    RolesGuard,
    EventPublisherService,
    CacheService,
  ],
})
export class TicketsModule {}
