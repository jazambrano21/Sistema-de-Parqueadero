import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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
    ConfigModule,
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