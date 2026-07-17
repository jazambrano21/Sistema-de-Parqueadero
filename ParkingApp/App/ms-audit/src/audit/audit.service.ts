import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { EventoAuditoria } from './entities/evento-auditoria.entity';
import { CacheService } from '../common/cache.service';

@Injectable()
export class AuditService {
  private readonly logger =
    new Logger(AuditService.name);

  constructor(
    @InjectRepository(EventoAuditoria)
    private readonly auditRepo:
      Repository<EventoAuditoria>,

    private readonly cacheService:
      CacheService,
  ) {}

  async create(
    dto: CreateAuditDto,
  ): Promise<EventoAuditoria> {
    const newEvent =
      this.auditRepo.create({
        ...dto,
        datos: dto.datos ?? {},
        timestamp: new Date(),
      });

    const eventoGuardado =
      await this.auditRepo.save(newEvent);

    await this.cacheService.set(
      `audit:id:${eventoGuardado.id}`,
      eventoGuardado,
      300000,
    );

    await this.cacheService.del(
      'audit:all',
    );

    this.logger.log(
      `Evento ${eventoGuardado.id} guardado y caché actualizada`,
    );

    return eventoGuardado;
  }

  async findAll():
    Promise<EventoAuditoria[]> {
    const cacheKey = 'audit:all';

    const auditoriasCache =
      await this.cacheService.get<
        EventoAuditoria[]
      >(cacheKey);

    if (auditoriasCache !== null) {
      this.logger.log(
        'findAll auditorías -> CACHE HIT',
      );

      return auditoriasCache;
    }

    this.logger.log(
      'findAll auditorías -> CACHE MISS - consultando base de datos',
    );

    const auditorias =
      await this.auditRepo.find({
        order: {
          timestamp: 'DESC',
        },
      });

    await this.cacheService.set(
      cacheKey,
      auditorias,
      30000,
    );

    return auditorias;
  }

  async findOne(
    id: string,
  ): Promise<EventoAuditoria | null> {
    const cacheKey =
      `audit:id:${id}`;

    const auditoriaCache =
      await this.cacheService.get<
        EventoAuditoria
      >(cacheKey);

    if (auditoriaCache !== null) {
      this.logger.log(
        `findOne(${id}) -> CACHE HIT`,
      );

      return auditoriaCache;
    }

    this.logger.log(
      `findOne(${id}) -> CACHE MISS - consultando base de datos`,
    );

    const auditoria =
      await this.auditRepo.findOne({
        where: { id },
      });

    if (auditoria !== null) {
      await this.cacheService.set(
        cacheKey,
        auditoria,
        300000,
      );
    }

    return auditoria;
  }

  async update(
    id: string,
    updateAuditDto: UpdateAuditDto,
  ): Promise<EventoAuditoria> {
    const auditoria =
      await this.auditRepo.findOne({
        where: { id },
      });

    if (!auditoria) {
      throw new Error(
        `No se encontró la auditoría con id ${id}`,
      );
    }

    Object.assign(
      auditoria,
      updateAuditDto,
    );

    const auditoriaActualizada =
      await this.auditRepo.save(
        auditoria,
      );

    await this.cacheService.del(
      `audit:id:${id}`,
    );

    await this.cacheService.del(
      'audit:all',
    );

    await this.cacheService.set(
      `audit:id:${id}`,
      auditoriaActualizada,
      300000,
    );

    this.logger.log(
      `Auditoría ${id} actualizada y caché invalidada`,
    );

    return auditoriaActualizada;
  }

  async remove(
    id: string,
  ): Promise<void> {
    const auditoria =
      await this.auditRepo.findOne({
        where: { id },
      });

    if (!auditoria) {
      throw new Error(
        `No se encontró la auditoría con id ${id}`,
      );
    }

    await this.auditRepo.remove(
      auditoria,
    );

    await this.cacheService.del(
      `audit:id:${id}`,
    );

    await this.cacheService.del(
      'audit:all',
    );

    this.logger.log(
      `Auditoría ${id} eliminada y caché invalidada`,
    );
  }
}