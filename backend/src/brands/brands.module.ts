import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DbModule } from '../db/db.module';
import { AdminBrandsController } from './admin-brands.controller';
import { BrandsController } from './brands.controller';
import { BrandsRepository } from './brands.repository';
import { BrandsService } from './brands.service';

@Module({
  imports: [AuthModule, DbModule],
  controllers: [BrandsController, AdminBrandsController],
  providers: [BrandsRepository, BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
