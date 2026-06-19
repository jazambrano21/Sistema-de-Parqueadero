import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
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
@Controller('vehiculo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ROLE_ADMIN')
export class VehiculoController {
  constructor(private readonly vehiculoService: VehiculosService) {}

  @Post()
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculoService.create(createVehiculoDto);
  }

  @Get()
  findAll() {
    return this.vehiculoService.findAll();
  }

  @Get('placa/:placa')
  findByPlaca(@Param('placa') placa: string) {
    return this.vehiculoService.findByPlaca(placa);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiculoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehiculoDto: UpdateVehiculoDto) {
    return this.vehiculoService.update(id, updateVehiculoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiculoService.remove(id);
  }
}
