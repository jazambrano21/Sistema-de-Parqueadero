import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { Repository } from 'typeorm';
import { HttpClientService } from './common/http-client.service';
import { ConfigService } from '@nestjs/config';
import { Vehiculo } from './interfaces/vehiculo.interface';
import { Persona } from './interfaces/persona.interface';
import { Espacio } from './interfaces/espacio.interface';
import { EventPublisherService } from '../common/event-publisher.service';
import { CacheService } from '../common/cache.service';

// TTLs de caché en segundos
const TTL_PERSONA  = 300; // 5 min  — datos de persona no cambian frecuentemente
const TTL_VEHICULO = 300; // 5 min  — datos de vehículo no cambian frecuentemente
// Los espacios NO se cachean: su estado (DISPONIBLE/OCUPADO) cambia en cada ticket

@Injectable()
export class TicketsService {

  private readonly logger = new Logger(TicketsService.name);
  private readonly personaUrl: string;
  private readonly vehiculoUrl: string;
  private readonly espacioUrl: string;
  private readonly tarifaPorHora: number;

  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private httpClient: HttpClientService,
    private configService: ConfigService,
    private readonly eventPublisher: EventPublisherService,
    private readonly cacheService: CacheService,
  ) {
    this.personaUrl  = this.configService.get('MS_PERSONAS')  || 'http://localhost:8082/api/users';
    this.vehiculoUrl = this.configService.get('MS_VEHICULOS') || 'http://localhost:3000/vehiculo';
    this.espacioUrl  = this.configService.get('MS_ZONAS')     || 'http://localhost:8081/api/espacios';
    this.tarifaPorHora = this.configService.get('TARIFA_HORA', 1.0);
  }

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────
  async create(createTicketDto: CreateTicketDto, context?: any): Promise<Ticket> {
    const { usuario, ip, mac } = this.extractUserInfo(context);
    const token = this.extractToken(context);

    // 1. Validar que la persona exista (con caché)
    const persona = await this.validarPersona(createTicketDto.dni, token);
    if (!persona) {
      throw new BadRequestException(`Persona con DNI: ${createTicketDto.dni} no encontrada`);
    }

    // 2. Validar que el vehículo exista (con caché)
    const vehiculo = await this.validarPlaca(createTicketDto.placa, token);
    if (!vehiculo) {
      throw new BadRequestException(`Vehículo con placa: ${createTicketDto.placa} no encontrado`);
    }

    // 3. Validar espacio disponible (SIN caché — el estado cambia constantemente)
    const espacio = await this.validarEspacioDisponible(createTicketDto.idEspacio, createTicketDto.nombreZona, token);
    if (!espacio) {
      throw new BadRequestException(`Espacio con ID: ${createTicketDto.idEspacio} no disponible`);
    }

    // 4. Validar que no haya ticket activo para esa placa
    await this.validarTicketActivo(createTicketDto.placa);

    // 5. Crear y guardar el ticket
    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      fechaHoraIngreso: new Date(),
      activo: true,
      valorRecaudado: 0,
    });

    const ticketGuardado = await this.ticketRepository.save(ticket);

    // 6. Cachear el ticket recién creado por su ID
    await this.cacheService.set(`ticket:${ticketGuardado.id}`, ticketGuardado, TTL_PERSONA);

    // 7. Invalidar caché de listas (ya que hay un nuevo ticket activo)
    await this.cacheService.del('tickets:all');
    await this.cacheService.del('tickets:activos');

    // 8. Publicar evento de auditoría
    await this.eventPublisher.publish({
      servicio: 'ms-tickets',
      accion: 'CREATE',
      entidad: 'TICKET',
      datos: {
        id: ticketGuardado.id,
        placa: ticketGuardado.placa,
        dni: ticketGuardado.dni,
        idEspacio: ticketGuardado.idEspacio,
        nombreZona: ticketGuardado.nombreZona,
        activo: ticketGuardado.activo,
        fechaHoraIngreso: ticketGuardado.fechaHoraIngreso,
      },
      usuario,
      ip,
      mac,
    });

    // 9. Marcar espacio como OCUPADO en ms-zonas
    await this.actualizarEstadoEspacio(createTicketDto.idEspacio, 'OCUPADO', token);

    this.logger.log(`Ticket creado con ID: ${ticketGuardado.id} para la placa ${createTicketDto.placa}`);
    return ticketGuardado;
  }

  // ─────────────────────────────────────────────
  // FIND ALL — cacheable
  // ─────────────────────────────────────────────
  async findAll(): Promise<Ticket[]> {
    const cacheKey = 'tickets:all';
    const cached = await this.cacheService.get<Ticket[]>(cacheKey);
    if (cached) {
      this.logger.log('findAll → CACHE HIT');
      return cached;
    }

    this.logger.log('findAll → CACHE MISS — consultando BD');
    const tickets = await this.ticketRepository.find({ order: { fechaHoraIngreso: 'DESC' } });
    await this.cacheService.set(cacheKey, tickets, 60); // 1 min TTL para listas
    return tickets;
  }

  // ─────────────────────────────────────────────
  // FIND ONE — cacheable por ID
  // ─────────────────────────────────────────────
  async findOne(id: string): Promise<Ticket> {
    const cacheKey = `ticket:${id}`;
    const cached = await this.cacheService.get<Ticket>(cacheKey);
    if (cached) {
      this.logger.log(`findOne(${id}) → CACHE HIT`);
      return cached;
    }

    this.logger.log(`findOne(${id}) → CACHE MISS — consultando BD`);
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new BadRequestException(`Ticket con ID: ${id} no encontrado`);
    }
    await this.cacheService.set(cacheKey, ticket, TTL_PERSONA);
    return ticket;
  }

  // ─────────────────────────────────────────────
  // FIND ACTIVOS — cacheable
  // ─────────────────────────────────────────────
  async findActivos(): Promise<Ticket[]> {
    const cacheKey = 'tickets:activos';
    const cached = await this.cacheService.get<Ticket[]>(cacheKey);
    if (cached) {
      this.logger.log('findActivos → CACHE HIT');
      return cached;
    }

    this.logger.log('findActivos → CACHE MISS — consultando BD');
    const tickets = await this.ticketRepository.find({
      where: { activo: true },
      order: { fechaHoraIngreso: 'DESC' },
    });
    await this.cacheService.set(cacheKey, tickets, 60); // 1 min — los activos cambian seguido
    return tickets;
  }

  // ─────────────────────────────────────────────
  // CERRAR TICKET
  // ─────────────────────────────────────────────
  async cerrarticket(id: string, updateTicketDto: UpdateTicketDto, context?: any): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (!ticket.activo) {
      throw new BadRequestException(`El ticket con ID: ${id} ya está cerrado`);
    }

    const fechaHoraSalida = new Date();
    const horas = this.calcularHoras(ticket.fechaHoraIngreso, fechaHoraSalida);
    const costo = horas * this.tarifaPorHora;

    ticket.activo = false;
    ticket.fechaHoraSalida = fechaHoraSalida;
    ticket.valorRecaudado = updateTicketDto.valorRecaudado ?? costo;

    const token = this.extractToken(context);

    // Liberar espacio
    await this.actualizarEstadoEspacio(ticket.idEspacio, 'DISPONIBLE', token);

    const closeTicket = await this.ticketRepository.save(ticket);

    // Actualizar caché del ticket individual e invalidar listas
    await this.cacheService.set(`ticket:${closeTicket.id}`, closeTicket, TTL_PERSONA);
    await this.cacheService.del('tickets:all');
    await this.cacheService.del('tickets:activos');

    const { usuario, ip, mac } = this.extractUserInfo(context);
    await this.eventPublisher.publish({
      servicio: 'ms-tickets',
      accion: 'UPDATE',
      entidad: 'TICKET',
      datos: {
        id: closeTicket.id,
        placa: closeTicket.placa,
        dni: closeTicket.dni,
        idEspacio: closeTicket.idEspacio,
        nombreZona: closeTicket.nombreZona,
        activo: closeTicket.activo,
        fechaHoraIngreso: closeTicket.fechaHoraIngreso,
        fechaHoraSalida: closeTicket.fechaHoraSalida,
        valorRecaudado: closeTicket.valorRecaudado,
        horasCobradas: horas,
      },
      usuario,
      ip,
      mac,
    }, 'audit.ticket.update');

    this.logger.log(`Ticket con ID: ${id} cerrado. Horas: ${horas}, Total: $${closeTicket.valorRecaudado}`);
    return closeTicket;
  }

  remove(id: string) {
    return `This action removes a #${id} ticket`;
  }

  // ─────────────────────────────────────────────
  // VALIDACIONES PRIVADAS
  // ─────────────────────────────────────────────

  /**
   * Valida persona por DNI. Cachea el resultado para evitar llamadas
   * repetidas al ms-usuarios durante el mismo período de tiempo.
   */
  private async validarPersona(dni: string, token?: string): Promise<Persona | null> {
    const cacheKey = `persona:${dni}`;
    const cached = await this.cacheService.get<Persona>(cacheKey);
    if (cached) {
      this.logger.log(`validarPersona(${dni}) → CACHE HIT`);
      return cached;
    }

    try {
      const url = `${this.personaUrl}/dni/${dni}`;
      const persona = await this.httpClient.get<Persona>(url, token);
      await this.cacheService.set(cacheKey, persona, TTL_PERSONA);
      this.logger.log(`validarPersona(${dni}) → CACHE MISS — guardado en caché`);
      return persona;
    } catch (error) {
      this.logger.error(`Error al validar persona con DNI ${dni}: ${error}`);
      return null;
    }
  }

  /**
   * Valida vehículo por placa. Cachea el resultado.
   */
  private async validarPlaca(placa: string, token?: string): Promise<Vehiculo | null> {
    const cacheKey = `vehiculo:${placa}`;
    const cached = await this.cacheService.get<Vehiculo>(cacheKey);
    if (cached) {
      this.logger.log(`validarPlaca(${placa}) → CACHE HIT`);
      return cached;
    }

    try {
      const url = `${this.vehiculoUrl}/placa/${placa}`;
      const vehiculo = await this.httpClient.get<Vehiculo>(url, token);
      await this.cacheService.set(cacheKey, vehiculo, TTL_VEHICULO);
      this.logger.log(`validarPlaca(${placa}) → CACHE MISS — guardado en caché`);
      return vehiculo;
    } catch (error) {
      this.logger.error(`Error al validar la placa ${placa}: ${error}`);
      return null;
    }
  }

  /**
   * Valida espacio disponible. NO se cachea porque el estado
   * (DISPONIBLE/OCUPADO) cambia en cada operación de ticket.
   */
  private async validarEspacioDisponible(idEspacio: string, zona: string, token?: string): Promise<Espacio | null> {
    try {
      const url = `${this.espacioUrl}/disponibles?zona=${encodeURIComponent(zona)}`;
      const espacios = await this.httpClient.get<Espacio[]>(url, token);
      return espacios.find(e => e.id === idEspacio && e.estado === 'DISPONIBLE') ?? null;
    } catch (error) {
      this.logger.error(`Error al validar espacio ${idEspacio}: ${error}`);
      return null;
    }
  }

  private async validarTicketActivo(placa: string): Promise<void> {
    const ticketActivo = await this.ticketRepository.findOne({ where: { placa, activo: true } });
    if (ticketActivo) {
      throw new BadRequestException(`Ya existe un ticket activo para la placa: ${placa}`);
    }
  }

  private calcularHoras(ingreso: Date, salida: Date): number {
    const diffMs = salida.getTime() - ingreso.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60));
  }

  private async actualizarEstadoEspacio(idEspacio: string, estado: string, token?: string): Promise<void> {
    try {
      const url = `${this.espacioUrl}/${idEspacio}/estado?estado=${estado}`;
      await this.httpClient.patch(url, {}, token);
      this.logger.log(`Espacio ${idEspacio} actualizado a estado ${estado}`);
    } catch (error) {
      this.logger.error(`Error al actualizar estado del espacio ${idEspacio}: ${error}`);
    }
  }

  private extractUserInfo(req: any): { usuario: string; ip: string; mac: string } {
    const usuario = req?.user?.username || req?.user?.sub || 'anonymous';
    const ip = req?.ip || req?.socket?.remoteAddress || '0.0.0.0';
    const mac = '00:00:00:00:00:00';
    return { usuario, ip, mac };
  }

  private extractToken(req: any): string | undefined {
    const auth = req?.headers?.authorization || req?.headers?.Authorization;
    if (auth?.startsWith('Bearer ')) {
      return auth.substring(7);
    }
    return undefined;
  }
}
