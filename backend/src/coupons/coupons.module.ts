import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DbModule } from '../db/db.module';
import { CouponsController } from './coupons.controller';
import { CouponsRepository } from './coupons.repository';
import { CouponsService } from './coupons.service';

@Module({
  imports: [AuthModule, DbModule],
  controllers: [CouponsController],
  providers: [CouponsRepository, CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
