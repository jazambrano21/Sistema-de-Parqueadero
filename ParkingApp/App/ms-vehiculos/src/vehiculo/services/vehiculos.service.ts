import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vehiculo } from '../entities/vehiculo.entity';
import { CreateVehiculoDto } from '../dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../dto/update-vehiculo.dto';
import { FactoryVehiculos } from '../factory/factory-vehiculos';

import { EventPublisherService } from '../../common/event-publisher.service';
import { CacheService } from '../../common/cache.service';

const TTL_VEHICULO = 300; // 5 min — datos de vehículo no cambian frecuentemente
const TTL_LISTA    = 60;  // 1 min — lista puede cambiar al crear/actualizar/eliminar

@Injectable()
export class VehiculosService {
  private readonly logger = new Logger(VehiculosService.name);

  constructor(
    @InjectRepository(Vehiculo)
    private readonly repositoryVehiculo: Repository<Vehiculo>,

    private readonly eventPublisher: EventPublisherService,
    private readonly cacheService: CacheService,
  ) {}

  async create(
    createVehiculoDto: CreateVehiculoDto,
    context?: any,
  ): Promise<Vehiculo> {
    const placaNormalizada = createVehiculoDto.datos.placa
      .trim()
      .toUpperCase();

    createVehiculoDto.datos.placa = placaNormalizada;

    const existe = await this.repositoryVehiculo.findOne({
      where: {
        placa: placaNormalizada,
      },
    });

    if (existe) {
      throw new Error(
        `Ya existe un vehículo con la placa ${placaNormalizada}`,
      );
    }

    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);

    const savedVehiculo =
      await this.repositoryVehiculo.save(vehiculo);

    await this.cacheService.set(
      `vehiculos:id:${savedVehiculo.id}`,
      savedVehiculo,
      300000,
    );

    await this.cacheService.set(
      `vehiculos:placa:${savedVehiculo.placa}`,
      savedVehiculo,
      300000,
    );

    await this.cacheService.del('vehiculos:all');

    // Cachear el vehículo recién creado y limpiar listas
    await this.cacheService.set(`vehiculo:id:${savedVehiculo.id}`, savedVehiculo, TTL_VEHICULO);
    await this.cacheService.set(`vehiculo:placa:${savedVehiculo.placa}`, savedVehiculo, TTL_VEHICULO);
    await this.cacheService.del('vehiculos:all');

    try {
      await this.eventPublisher.publish({
        servicio: 'ms-vehiculos',
        accion: 'CREATE',
        entidad: 'VEHICULO',
        datos: {
          id: savedVehiculo.id,
          placa: savedVehiculo.placa,
          tipo: createVehiculoDto.tipo,
          marca: createVehiculoDto.datos.marca,
          modelo: createVehiculoDto.datos.modelo,
        },
        usuario: this.resolveUser(context),
        ip: this.resolveIp(context),
        mac: this.resolveMac(context),
      });
    } catch (error) {
      this.logger.warn(`No se pudo publicar la auditoría: ${error instanceof Error ? error.message : error}`);
    }

    return savedVehiculo;
  }

  // ─────────────────────────────────────────────
  // FIND ALL — cacheable
  // ─────────────────────────────────────────────
  async findAll(): Promise<Vehiculo[]> {
    const cacheKey = 'vehiculos:all';
    const cached = await this.cacheService.get<Vehiculo[]>(cacheKey);
    if (cached) {
      this.logger.log('findAll → CACHE HIT');
      return cached;
    }

    this.logger.log('findAll → CACHE MISS — consultando BD');
    const vehiculos = await this.repositoryVehiculo.find();
    await this.cacheService.set(cacheKey, vehiculos, TTL_LISTA);
    return vehiculos;
  }

  // ─────────────────────────────────────────────
  // FIND ONE por ID — cacheable
  // ─────────────────────────────────────────────
  async findOne(id: string): Promise<Vehiculo> {
    const cacheKey = `vehiculo:id:${id}`;
    const cached = await this.cacheService.get<Vehiculo>(cacheKey);
    if (cached) {
      this.logger.log(`findOne(${id}) → CACHE HIT`);
      return cached;
    }

    this.logger.log(`findOne(${id}) → CACHE MISS — consultando BD`);
    const vehiculo = await this.repositoryVehiculo.findOne({ where: { id } });
    if (!vehiculo) {
      throw new Error(`No se encontró un vehículo con el id ${id}`);
    }
    await this.cacheService.set(cacheKey, vehiculo, TTL_VEHICULO);
    return vehiculo;
  }

  // ─────────────────────────────────────────────
  // FIND BY PLACA — cacheable (ms-tickets lo llama mucho)
  // ─────────────────────────────────────────────
  async findByPlaca(placa: string): Promise<Vehiculo> {
    const cacheKey = `vehiculo:placa:${placa}`;
    const cached = await this.cacheService.get<Vehiculo>(cacheKey);
    if (cached) {
      this.logger.log(`findByPlaca(${placa}) → CACHE HIT`);
      return cached;
    }

    this.logger.log(`findByPlaca(${placa}) → CACHE MISS — consultando BD`);
    const vehiculo = await this.repositoryVehiculo.findOne({ where: { placa } });
    if (!vehiculo) {
      throw new Error(`No se encontró un vehículo con la placa ${placa}`);
    }
    await this.cacheService.set(cacheKey, vehiculo, TTL_VEHICULO);
    return vehiculo;
  }

  // ─────────────────────────────────────────────
  // UPDATE — invalida caché del vehículo
  // ─────────────────────────────────────────────
  async update(id: string, updateVehiculoDto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);
    Object.assign(vehiculo, updateVehiculoDto);
    const updated = await this.repositoryVehiculo.save(vehiculo);

    // Actualizar caché e invalidar listas
    await this.cacheService.set(`vehiculo:id:${updated.id}`, updated, TTL_VEHICULO);
    await this.cacheService.set(`vehiculo:placa:${updated.placa}`, updated, TTL_VEHICULO);
    await this.cacheService.del('vehiculos:all');

    return updated;
  }

  // ─────────────────────────────────────────────
  // REMOVE — invalida caché
  // ─────────────────────────────────────────────
  async remove(id: string): Promise<void> {
    const vehiculo = await this.findOne(id);

    await this.repositoryVehiculo.remove(vehiculo);

    await this.cacheService.del(`vehiculo:id:${id}`);
    await this.cacheService.del(`vehiculo:placa:${vehiculo.placa}`);
    await this.cacheService.del('vehiculos:all');
  }

  // ─────────────────────────────────────────────
  // Helpers de contexto
  // ─────────────────────────────────────────────
  private resolveUser(context?: any): string {
    const user = context?.user;

    return (
      user?.username ||
      user?.sub ||
      user?.email ||
      context?.username ||
      context?.usuario ||
      'anonymous'
    );
  }

  private resolveIp(context?: any): string {
    const forwarded = context?.headers?.['x-forwarded-for'];
    if (Array.isArray(forwarded)) return forwarded[0];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return context?.ip || context?.request?.ip || '0.0.0.0';
  }

  private resolveMac(context?: any): string {
    const header = context?.headers?.['x-client-mac'] || context?.headers?.['x-mac-address'];
    if (Array.isArray(header)) return header[0];
    if (typeof header === 'string') return header;
    return context?.mac || '00:00:00:00:00:00';
  }
}
