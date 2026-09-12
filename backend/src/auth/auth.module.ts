import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { AdminsModule } from '../admins/admins.module';
import { CustomersModule } from '../customers/customers.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { OptionalCustomerJwtAuthGuard } from './guards/optional-customer-jwt-auth.guard';

@Module({
  imports: [
    AdminsModule,
    CustomersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<StringValue>('JWT_EXPIRES_IN') ?? '1d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AdminJwtAuthGuard,
    CustomerJwtAuthGuard,
    OptionalCustomerJwtAuthGuard,
  ],
  exports: [
    AuthService,
    AdminJwtAuthGuard,
    CustomerJwtAuthGuard,
    JwtModule,
    OptionalCustomerJwtAuthGuard,
  ],
})
export class AuthModule {}
