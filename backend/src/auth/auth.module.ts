import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule } from 'src/config/config.module';
import { AuthConfigService } from 'src/config/services/auth-config.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [AuthConfigService],
      useFactory: async (configService: AuthConfigService) => ({
        secret: configService.get().jwt.secret,
        signOptions: {
          expiresIn: configService.get().jwt.expiresIn
        } as JwtSignOptions
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: []
})
export class AuthModule {}
