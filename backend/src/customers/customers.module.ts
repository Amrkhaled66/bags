import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { DbModule } from '../db/db.module';
import { CustomersController } from './customers.controller';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';

@Module({
  imports: [DbModule, JwtModule.register({})],
  controllers: [CustomersController],
  providers: [AdminJwtAuthGuard, CustomersRepository, CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
