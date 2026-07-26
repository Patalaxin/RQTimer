import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGateway } from './auth.gateway';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.SECRET_CONSTANT,
      signOptions: { expiresIn: '900s' }, // 15 min live for access token
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGateway],
  exports: [AuthService, AuthGateway],
})
export class AuthModule {}
