import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vehiculo } from '../entities/vehiculo.entity';
import { CreateVehiculoDto } from '../dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../dto/update-vehiculo.dto';
import { FactoryVehiculos } from '../factory/factory-vehiculos';

import { EventPublisherService } from '../../common/event-publisher.service';
import { CacheService } from '../../common/cache.service';

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
    const tenantId: string | null = context?.user?.tenantId ?? null;

    const placaNormalizada = createVehiculoDto.datos.placa
      .trim()
      .toUpperCase();

    createVehiculoDto.datos.placa = placaNormalizada;

    // Validar duplicado de placa dentro del mismo tenant
    const where: any = { placa: placaNormalizada };
    if (tenantId) where.tenantId = tenantId;

    const existe = await this.repositoryVehiculo.findOne({ where });

    if (existe) {
      throw new Error(
        `Ya existe un vehículo con la placa ${placaNormalizada}`,
      );
    }

    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);
    vehiculo.tenantId = tenantId;

    const savedVehiculo = await this.repositoryVehiculo.save(vehiculo);

    // Cache keys segmentadas por tenant
    const suffix = tenantId ? `:${tenantId}` : '';
    await this.cacheService.set(`vehiculos:id:${savedVehiculo.id}`, savedVehiculo, 300000);
    await this.cacheService.set(`vehiculos:placa:${savedVehiculo.placa}${suffix}`, savedVehiculo, 300000);
    await this.cacheService.del(`vehiculos:all${suffix}`);

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
          tenantId,
        },
        usuario: this.resolveUser(context),
        ip: this.resolveIp(context),
        mac: this.resolveMac(context),
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo publicar la auditoría del vehículo: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return savedVehiculo;
  }

  async findAll(tenantId?: string | null): Promise<Vehiculo[]> {
    const suffix = tenantId ? `:${tenantId}` : '';
    const cacheKey = `vehiculos:all${suffix}`;

    const vehiculosCache = await this.cacheService.get<Vehiculo[]>(cacheKey);
    if (vehiculosCache !== null) {
      this.logger.log('findAll vehículos -> CACHE HIT');
      return vehiculosCache;
    }

    this.logger.log('findAll vehículos -> CACHE MISS - consultando base de datos');

    const where = tenantId ? { tenantId } : {};
    const vehiculos = await this.repositoryVehiculo.find({ where });

    await this.cacheService.set(cacheKey, vehiculos, 60000);
    return vehiculos;
  }

  async findOne(id: string, tenantId?: string | null): Promise<Vehiculo> {
    const cacheKey = `vehiculos:id:${id}`;

    const vehiculoCache = await this.cacheService.get<Vehiculo>(cacheKey);
    if (vehiculoCache !== null) {
      // Validar que el vehículo cacheado pertenezca al tenant del solicitante
      if (tenantId && vehiculoCache.tenantId && vehiculoCache.tenantId !== tenantId) {
        throw new Error(`No se encontró un vehículo con el id ${id}`);
      }
      this.logger.log(`findOne(${id}) -> CACHE HIT`);
      return vehiculoCache;
    }

    this.logger.log(`findOne(${id}) -> CACHE MISS - consultando base de datos`);

    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    const vehiculo = await this.repositoryVehiculo.findOne({ where });

    if (!vehiculo) {
      throw new Error(`No se encontró un vehículo con el id ${id}`);
    }

    await this.cacheService.set(cacheKey, vehiculo, 300000);
    const suffix = tenantId ? `:${tenantId}` : '';
    await this.cacheService.set(`vehiculos:placa:${vehiculo.placa}${suffix}`, vehiculo, 300000);

    return vehiculo;
  }

  async findByPlaca(placa: string, tenantId?: string | null): Promise<Vehiculo> {
    const placaNormalizada = placa.trim().toUpperCase();
    const suffix = tenantId ? `:${tenantId}` : '';
    const cacheKey = `vehiculos:placa:${placaNormalizada}${suffix}`;

    const vehiculoCache = await this.cacheService.get<Vehiculo>(cacheKey);
    if (vehiculoCache !== null) {
      this.logger.log(`findByPlaca(${placaNormalizada}) -> CACHE HIT`);
      return vehiculoCache;
    }

    this.logger.log(`findByPlaca(${placaNormalizada}) -> CACHE MISS - consultando base de datos`);

    const where: any = { placa: placaNormalizada };
    if (tenantId) where.tenantId = tenantId;

    const vehiculo = await this.repositoryVehiculo.findOne({ where });

    if (!vehiculo) {
      throw new Error(`No se encontró un vehículo con la placa ${placaNormalizada}`);
    }

    await this.cacheService.set(cacheKey, vehiculo, 300000);
    await this.cacheService.set(`vehiculos:id:${vehiculo.id}`, vehiculo, 300000);

    return vehiculo;
  }

  async update(
    id: string,
    updateVehiculoDto: UpdateVehiculoDto,
    tenantId?: string | null,
  ): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id, tenantId);
    const placaAnterior = vehiculo.placa;

    Object.assign(vehiculo, updateVehiculoDto);

    if (vehiculo.placa) {
      vehiculo.placa = vehiculo.placa.trim().toUpperCase();
    }

    const vehiculoActualizado = await this.repositoryVehiculo.save(vehiculo);

    const suffix = tenantId ? `:${tenantId}` : '';
    await this.cacheService.del(`vehiculos:id:${id}`);
    await this.cacheService.del(`vehiculos:placa:${placaAnterior}${suffix}`);
    await this.cacheService.del(`vehiculos:all${suffix}`);
    await this.cacheService.set(`vehiculos:id:${vehiculoActualizado.id}`, vehiculoActualizado, 300000);
    await this.cacheService.set(`vehiculos:placa:${vehiculoActualizado.placa}${suffix}`, vehiculoActualizado, 300000);

    return vehiculoActualizado;
  }

  async remove(id: string, tenantId?: string | null): Promise<void> {
    const vehiculo = await this.findOne(id, tenantId);

    await this.repositoryVehiculo.remove(vehiculo);

    const suffix = tenantId ? `:${tenantId}` : '';
    await this.cacheService.del(`vehiculos:id:${id}`);
    await this.cacheService.del(`vehiculos:placa:${vehiculo.placa}${suffix}`);
    await this.cacheService.del(`vehiculos:all${suffix}`);

    this.logger.log(`Vehículo ${id} eliminado y caché invalidada [tenant: ${tenantId}]`);
  }

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
    const forwarded =
      context?.headers?.['x-forwarded-for'];

    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }

    if (typeof forwarded === 'string') {
      return forwarded
        .split(',')[0]
        .trim();
    }

    return (
      context?.ip ||
      context?.request?.ip ||
      '0.0.0.0'
    );
  }

  private resolveMac(context?: any): string {
    const header =
      context?.headers?.['x-client-mac'] ||
      context?.headers?.['x-mac-address'];

    if (Array.isArray(header)) {
      return header[0];
    }

    if (typeof header === 'string') {
      return header;
    }

    return (
      context?.mac ||
      '00:00:00:00:00:00'
    );
  }
}