import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { DbModule } from '../db/db.module';
import { AdminsController } from './admins.controller';
import { AdminsRepository } from './admins.repository';
import { AdminsService } from './admins.service';

@Module({
  imports: [DbModule, JwtModule.register({})],
  controllers: [AdminsController],
  providers: [AdminJwtAuthGuard, AdminsRepository, AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}
