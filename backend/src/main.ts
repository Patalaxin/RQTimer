import { resolve } from 'path';
import * as dotenv from 'dotenv';

// Must run before AppModule (and anything it pulls in, like the WebSocket
// gateways) is required — decorator metadata such as `@WebSocketGateway({cors})`
// evaluates at module-load time, before any code below this line runs.
dotenv.config({ path: resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const { AppModule } = require('./app/app.module');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const corsOptions: CorsOptions = {
    origin: configService.get<string>('CORS_ORIGIN'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  };

  const config = new DocumentBuilder()
    .setTitle('Royal Quest Timer API')
    .setDescription('Timer for PvE Bosses and Elites Mobs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  document.servers = [
    {
      url: configService.get<string>('SWAGGER_SERVER_URL'),
      description: 'API server',
    },
  ];

  SwaggerModule.setup('swagger', app, document, {});

  app.use(cookieParser());
  app.enableCors(corsOptions);
  await app.listen(configService.get<number>('PORT') ?? 3000);
}

bootstrap();
