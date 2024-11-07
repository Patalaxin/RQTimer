import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Token, TokenSchema } from '../schemas/refreshToken.schema';
import { AuthGateway } from './auth.gateway';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.SECRET_CONSTANT,
      signOptions: { expiresIn: '900s' }, // 15 min live for access token
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGateway,
    { provide: 'IAuth', useClass: AuthService },
  ],
  exports: [AuthService, AuthGateway],
})
export class AuthModule {}
