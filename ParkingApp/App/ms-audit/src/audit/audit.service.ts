import { Injectable, Logger } from '@nestjs/common';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { EventoAuditoria } from './entities/evento-auditoria.entity';
import { CacheService } from '../common/cache.service';

const TTL_EVENTO = 120; // 2 min — eventos individuales
const TTL_LISTA  = 60;  // 1 min — lista completa cambia con cada nuevo evento

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(EventoAuditoria)
    private readonly auditRepo: Repository<EventoAuditoria>,
    private readonly cacheService: CacheService,
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

    const saved = await this.auditRepo.save(newEvent);

    // Cachear el evento nuevo e invalidar la lista
    await this.cacheService.set(`audit:${saved.id}`, saved, TTL_EVENTO);
    await this.cacheService.del('audit:all');

    return saved;
  }

  // ─────────────────────────────────────────────
  // FIND ALL — cacheable (audit es read-heavy)
  // ─────────────────────────────────────────────
  async findAll() {
    const cacheKey = 'audit:all';
    const cached = await this.cacheService.get<EventoAuditoria[]>(cacheKey);
    if (cached) {
      this.logger.log('findAll → CACHE HIT');
      return cached;
    }

    this.logger.log('findAll → CACHE MISS — consultando BD');
    const eventos = await this.auditRepo.find({ order: { timestamp: 'DESC' } });
    await this.cacheService.set(cacheKey, eventos, TTL_LISTA);
    return eventos;
  }

  // ─────────────────────────────────────────────
  // FIND ONE — cacheable por ID
  // ─────────────────────────────────────────────
  async findOne(id: string) {
    const cacheKey = `audit:${id}`;
    const cached = await this.cacheService.get<EventoAuditoria>(cacheKey);
    if (cached) {
      this.logger.log(`findOne(${id}) → CACHE HIT`);
      return cached;
    }

    this.logger.log(`findOne(${id}) → CACHE MISS — consultando BD`);
    const evento = await this.auditRepo.findOne({ where: { id } });
    if (evento) {
      await this.cacheService.set(cacheKey, evento, TTL_EVENTO);
    }
    return evento;
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