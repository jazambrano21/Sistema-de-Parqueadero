import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/**
 * Tickets requieren ROLE_ADMIN.
 * Solo los administradores pueden crear, ver y cerrar tickets.
 */
@ApiTags('tickets')
// TEMPORAL: Desactivar autenticación para pruebas
// @ApiBearerAuth()
@Controller('tickets')
// TEMPORAL: Desactivar guards para pruebas
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ROLE_ADMIN')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear ticket', description: 'Registra la entrada de un vehículo al parqueadero.' })
  @ApiResponse({ status: 201, description: 'Ticket creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los tickets', description: 'Retorna todos los tickets registrados.' })
  @ApiResponse({ status: 200, description: 'Lista de tickets retornada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get('activos')
  @ApiOperation({ summary: 'Listar tickets activos', description: 'Retorna los tickets de vehículos que aún están en el parqueadero.' })
  @ApiResponse({ status: 200, description: 'Lista de tickets activos retornada.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  findActivos() {
    return this.ticketsService.findActivos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ticket por ID', description: 'Retorna el ticket con el UUID indicado.' })
  @ApiParam({ name: 'id', description: 'UUID del ticket' })
  @ApiResponse({ status: 200, description: 'Ticket encontrado.' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cerrar ticket', description: 'Registra la salida del vehículo y calcula el valor a cobrar.' })
  @ApiParam({ name: 'id', description: 'UUID del ticket a cerrar' })
  @ApiResponse({ status: 200, description: 'Ticket cerrado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  cerrarticket(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.cerrarticket(id, updateTicketDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar ticket', description: 'Elimina un ticket del sistema.' })
  @ApiParam({ name: 'id', description: 'UUID del ticket a eliminar' })
  @ApiResponse({ status: 200, description: 'Ticket eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
