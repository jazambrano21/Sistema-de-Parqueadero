import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { VehiculosService } from './services/vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/**
 * Todos los endpoints de vehículos requieren ROLE_ADMIN.
 * Solo los administradores pueden registrar, ver o eliminar vehículos.
 */
@ApiTags('vehiculos')
// TEMPORAL: Desactivar autenticación para pruebas
// @ApiBearerAuth()
@Controller('vehiculo')
// TEMPORAL: Desactivar guards para pruebas
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ROLE_ADMIN')
export class VehiculoController {
  constructor(private readonly vehiculoService: VehiculosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar vehículo', description: 'Crea un nuevo registro de vehículo en el sistema.' })
  @ApiResponse({ status: 201, description: 'Vehículo creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculoService.create(createVehiculoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos', description: 'Retorna todos los vehículos registrados.' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos retornada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  findAll() {
    return this.vehiculoService.findAll();
  }

  @Get('placa/:placa')
  @ApiOperation({ summary: 'Buscar por placa', description: 'Retorna el vehículo asociado a la placa indicada.' })
  @ApiParam({ name: 'placa', description: 'Placa del vehículo (formato ABC-1234)', example: 'ABC-1234' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  findByPlaca(@Param('placa') placa: string) {
    return this.vehiculoService.findByPlaca(placa);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener vehículo por ID', description: 'Retorna el vehículo con el UUID indicado.' })
  @ApiParam({ name: 'id', description: 'UUID del vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  findOne(@Param('id') id: string) {
    return this.vehiculoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar vehículo', description: 'Actualiza los datos de un vehículo existente.' })
  @ApiParam({ name: 'id', description: 'UUID del vehículo a actualizar' })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  update(@Param('id') id: string, @Body() updateVehiculoDto: UpdateVehiculoDto) {
    return this.vehiculoService.update(id, updateVehiculoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vehículo', description: 'Elimina un vehículo del sistema.' })
  @ApiParam({ name: 'id', description: 'UUID del vehículo a eliminar' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  remove(@Param('id') id: string) {
    return this.vehiculoService.remove(id);
  }
}
