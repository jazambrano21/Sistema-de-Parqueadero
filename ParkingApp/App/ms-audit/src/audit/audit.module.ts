import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditConsumer } from './audit.consumer';
import { EventoAuditoria } from './entities/evento-auditoria.entity';
import { CacheService } from '../common/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventoAuditoria]),
    ConfigModule,
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditConsumer, CacheService],
})
export class AuditModule {}