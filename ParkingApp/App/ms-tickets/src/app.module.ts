import * as crypto from 'crypto';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsModule } from './tickets/tickets.module';
import { Ticket } from './tickets/entities/ticket.entity';
import { AuthModule } from './auth/auth.module';

const databaseHost = process.env.DB_HOST ?? 'localhost';
const databasePort = parseInt(process.env.DB_PORT ?? '5432', 10);
const databaseUser = process.env.DB_USUARIO ?? process.env.DB_USERNAME ?? 'postgres';
const databasePassword = process.env.DB_CONTRASENA ?? process.env.DB_PASSWORD ?? '12345678';
const databaseName = process.env.DB_NOMBRE ?? process.env.DB_DATABASE ?? 'parking_db';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'postgres',
<<<<<<< Updated upstream
        host: databaseHost,
        port: databasePort,
        username: databaseUser,
        password: databasePassword,
        database: databaseName,
=======
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: Number(configService.get<string>('DB_PORT') || 5432),
        username: configService.get<string>('DB_USUARIO') || 'postgres',
        password: configService.get<string>('DB_CONTRASENA') || '12345678',
        database: configService.get<string>('DB_NOMBRE') || 'tickets_db',
>>>>>>> Stashed changes
        entities: [Ticket],
        synchronize: true,
        logging: true,
      }),
    }),
    AuthModule,
    TicketsModule,
  ],
})
export class AppModule {}