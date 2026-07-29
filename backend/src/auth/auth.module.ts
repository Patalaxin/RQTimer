import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGateway } from './auth.gateway';
import { EnvironmentVariables } from '../config/env.validation';

@Module({
  imports: [
    // Секрет задаётся здесь один раз и становится значением по умолчанию для
    // sign и verify. Раньше он же дублировался в каждом вызове JwtService.
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get('SECRET_CONSTANT', { infer: true }),
        signOptions: { expiresIn: '900s' }, // 15 min live for access token
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGateway],
  exports: [AuthService, AuthGateway],
})
export class AuthModule {}
