import { Module } from '@nestjs/common';
import { VehiculosModule } from './vehiculo/vehiculo.module';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), AuthModule, VehiculosModule],
})
export class AppModule {}