import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Vehiculo } from 'src/vehiculo/entities/vehiculo.entity';
import { Auto } from 'src/vehiculo/entities/auto.entity';
import { Motocicleta } from 'src/vehiculo/entities/motocicleta.entity';
import { Camioneta } from 'src/vehiculo/entities/camioneta.entity';

const databaseUser = process.env.DB_USUARIO ?? process.env.DB_USERNAME ?? 'postgres';
const databasePassword = process.env.DB_CONTRASENA ?? process.env.DB_PASSWORD ?? '';
const databaseName = process.env.DB_NOMBRE ?? process.env.DB_DATABASE ?? 'parking_db';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: databaseUser,
  password: databasePassword,
  database: databaseName,
  entities: [Vehiculo, Auto, Motocicleta, Camioneta],
  synchronize: true, // Solo desarrollo
  logging: true,
};