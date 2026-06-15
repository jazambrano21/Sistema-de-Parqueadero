import { Module } from '@nestjs/common';
import { VehiculosModule } from './vehiculo/vehiculo.module';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), VehiculosModule],
})
export class AppModule {}