import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Swagger / OpenAPI ──────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Tickets API - Sistema Parqueadero')
    .setDescription('Gestión de tickets de entrada/salida del parqueadero')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  // ──────────────────────────────────────────────────────────────────

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
