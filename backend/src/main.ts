import { resolve } from 'path';
import * as dotenv from 'dotenv';

// Must run before AppModule (and anything it pulls in, like the WebSocket
// gateways) is required — decorator metadata such as `@WebSocketGateway({cors})`
// evaluates at module-load time, before any code below this line runs.
dotenv.config({ path: resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
// Только тип: этот импорт не должен ничего исполнять до dotenv.config() выше.
import type { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  // Ленивый require намеренно: статический import подняли бы к началу файла,
  // выше dotenv.config() (см. комментарий там же).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AppModule } = require('./app/app.module');
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const corsOptions: CorsOptions = {
    origin: configService.get('CORS_ORIGIN', { infer: true }),
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
      url: configService.get('SWAGGER_SERVER_URL', { infer: true }),
      description: 'API server',
    },
  ];

  SwaggerModule.setup('swagger', app, document, {});

  app.use(cookieParser());
  app.enableCors(corsOptions);
  await app.listen(configService.get('PORT', { infer: true }));
}

// Упасть на старте — нормально (порт занят, БД недоступна, конфиг невалиден),
// но с внятной строчкой в логе, а не дампом unhandled rejection.
bootstrap().catch((error) => {
  new Logger('Bootstrap').error(
    'Не удалось запустить приложение',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
