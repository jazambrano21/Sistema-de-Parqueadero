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
  ) {
    this.personaUrl = this.configService.get('MS_PERSONAS') || 'http://localhost:8080/api/users';
    this.vehiculoUrl = this.configService.get('MS_VEHICULOS') || 'http://localhost:3000/vehiculo';   
    this.espacioUrl = this.configService.get('MS_ZONAS') || 'http://localhost:8081/api/espacios';
    this.tarifaPorHora = this.configService.get('TARIFA_HORA', 1.0);
  }

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {

    //1.- Validar que la persona exista
    const persona = await this.validarPersona(createTicketDto.dni);
    if (!persona) {
      throw new BadRequestException(`Persona con DNI: ${createTicketDto.dni} no encontrada`); 
    }

    //2.- Validar que el vehículo exista
    const vehiculo = await this.validarPlaca(createTicketDto.placa);
    if (!vehiculo) {
      throw new BadRequestException(`Vehículo con placa: ${createTicketDto.placa} no encontrado`);
    }

    //3.- Validar el espacio disponible
    const espacio = await this.validarEspacioDisponible(createTicketDto.idEspacio, createTicketDto.nombreZona); 
    if (!espacio) {
      throw new BadRequestException(`Espacio con ID: ${createTicketDto.idEspacio} no disponible`);
    }

    //4.- Validar tickets no activos
    await this.validarTicketActivo(createTicketDto.placa);        

    //5.- Crear el ticket
    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      fechaHoraIngreso: new Date(),
      activo: true,
      valorRecaudado: 0,
    });

    const ticketGuardado = await this.ticketRepository.save(ticket);
    
    // Actualizar estado del espacio a OCUPADO
    await this.actualizarEstadoEspacio(createTicketDto.idEspacio, 'OCUPADO');
    
    this.logger.log(`Ticket creado con ID: ${ticketGuardado.id} para la placa ${createTicketDto.placa}`); 
    return ticketGuardado;                                        
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({order: {fechaHoraIngreso: 'DESC'}});
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) 
      throw new BadRequestException(`Ticket con ID: ${id} no encontrado`);
    return ticket;
  }

  async findActivos(): Promise<Ticket[]> {
    return this.ticketRepository.find({ where: { activo: true }, order: {fechaHoraIngreso: 'DESC'} });
  }



  async cerrarticket(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);
    if (!ticket) {
      throw new BadRequestException(`Ticket con ID: ${id} no encontrado`);
    }
    
    const fechaHoraSalida = new Date();

    const horas = this.calcularHoras(ticket.fechaHoraIngreso, fechaHoraSalida);
    const costo = horas * this.tarifaPorHora;

    ticket.activo = false;
    ticket.fechaHoraSalida = fechaHoraSalida;
    ticket.valorRecaudado = updateTicketDto.valorRecaudado || costo;

    // Actualizar estado del espacio a DISPONIBLE
    await this.actualizarEstadoEspacio(ticket.idEspacio, 'DISPONIBLE');

    const closeTicket = await this.ticketRepository.save(ticket);
    this.logger.log(`Ticket con ID: ${id} cerrado.`);
    return closeTicket;
  }

  remove(id: string) {
    return `This action removes a #${id} ticket`;
  }

  //Metodos privados para cada una de las validaciones
  private async validarPersona(dni: string): Promise<Persona | null> {
    try {
      const url = `${this.personaUrl}/dni/${dni}`;
      const persona = await this.httpClient.get<Persona>(url);
      return persona;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }                                                              

  private async validarPlaca(placa: string): Promise<Vehiculo | null> {
    try {
      const url = `${this.vehiculoUrl}/placa/${placa}`;
      const vehiculo = await this.httpClient.get<Vehiculo>(url);
      return vehiculo;
    } catch (error) {
      this.logger.error(`Error al validar la placa (${placa}): (error)`); 
      return null;
    }
  }

  private async validarEspacioDisponible(idEspacio: string, zona: string): Promise<Espacio | null> {
    try {
      const url = `${this.espacioUrl}/disponibles?zona=${zona}`;
      const espacios = await this.httpClient.get<Espacio[]>(url);

      return espacios.find(                                       
        espacio => espacio.id === idEspacio && espacio.estado === 'DISPONIBLE'
      ) ?? null;
    } catch (error) {
      this.logger.error(`Error al validar el espacio (error)`);
      return null;
    }
  }

  private async validarTicketActivo(placa: string): Promise<void> { 
    try {
      const ticketActivo = await this.ticketRepository.findOne(
        { where: { placa, activo: true } });
      if (ticketActivo) {
        throw new BadRequestException(`Ya existe un ticket activo con esta placa`);
      }
    } catch (error) {                                             
      throw error;
    } 
  }

  private calcularHoras(ingreso: Date, salida: Date): number {
    const diffMs = salida.getTime() - ingreso.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    return Math.ceil(diffHoras); 
  }

  private async actualizarEstadoEspacio(idEspacio: string, estado: string): Promise<void> {
    try {
      const url = `${this.espacioUrl}/${idEspacio}/estado?estado=${estado}`;
      await this.httpClient.patch(url, {});
      this.logger.log(`Espacio ${idEspacio} actualizado a estado ${estado}`);
    } catch (error) {
      this.logger.error(`Error al actualizar estado del espacio ${idEspacio}: ${error}`);
      // No lanzamos error para no interrumpir el flujo principal
    }
  }
}

// LEVANTAR TODOS LOS MICROSERVICIOS PARA PROBAR EL SERVICIO DE TICKETS, 
// SI NO SE CUENTA CON LOS OTROS MICROSERVICIOS SE PUEDEN SIMULAR LAS RESPUESTAS CON MOCKS O STUBS.
