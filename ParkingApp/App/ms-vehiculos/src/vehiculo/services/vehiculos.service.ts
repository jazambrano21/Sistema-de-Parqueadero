import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehiculo } from '../entities/vehiculo.entity';
import { Repository } from 'typeorm';
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
    private repositoryVehiculo: Repository<Vehiculo>,
    private readonly eventPublisher: EventPublisherService,
    private readonly cacheService: CacheService,
  ) {}

  async create(createVehiculoDto: CreateVehiculoDto, context?: any): Promise<Vehiculo> {
    const existe = await this.repositoryVehiculo.findOne({
      where: { placa: createVehiculoDto.datos.placa },
    });

    if (existe) {
      throw new Error(`Ya existe un vehículo con la placa ${createVehiculoDto.datos.placa}`);
    }

    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);
    const savedVehiculo = await this.repositoryVehiculo.save(vehiculo);

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
      this.logger.warn(`No se pudo publicar la auditoría del vehículo: ${error instanceof Error ? error.message : error}`);
    }

    return savedVehiculo;
  }

  async findAll(): Promise<Vehiculo[]> {
    return this.repositoryVehiculo.find();
  }

  async findOne(id: string): Promise<Vehiculo> {
    const vehiculo = await this.repositoryVehiculo.findOne({ where: { id } });
    if (!vehiculo) {
      throw new Error(`No se encontró un vehículo con el id ${id}`);
    }
    return vehiculo;
  }

  async findByPlaca(placa: string): Promise<Vehiculo> {
    const vehiculo = await this.repositoryVehiculo.findOne({ where: { placa } });
    if (!vehiculo) {
      throw new Error(`No se encontró un vehículo con la placa ${placa}`);
    }
    return vehiculo;
  }

  async update(id: string, updateVehiculoDto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);
    Object.assign(vehiculo, updateVehiculoDto);
    return this.repositoryVehiculo.save(vehiculo);
  }

  async remove(id: string): Promise<void> {
    const vehiculo = await this.findOne(id);
    await this.repositoryVehiculo.remove(vehiculo);
  }

  private resolveUser(context?: any): string {
    const user = context?.user;
    return user?.username || user?.sub || user?.email || context?.username || context?.usuario || 'anonymous';
  }

  private resolveIp(context?: any): string {
    const forwarded = context?.headers?.['x-forwarded-for'];
    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return context?.ip || context?.request?.ip || '0.0.0.0';
  }

  private resolveMac(context?: any): string {
    const header = context?.headers?.['x-client-mac'] || context?.headers?.['x-mac-address'];
    if (Array.isArray(header)) {
      return header[0];
    }
    if (typeof header === 'string') {
      return header;
    }
    return context?.mac || '00:00:00:00:00:00';
  }
}