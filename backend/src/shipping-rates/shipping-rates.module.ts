import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DbModule } from '../db/db.module';
import { ShippingRatesController } from './shipping-rates.controller';
import { AdminShippingRatesController } from './admin-shipping-rates.controller';
import { ShippingRatesRepository } from './shipping-rates.repository';
import { ShippingRatesService } from './shipping-rates.service';

@Module({
  imports: [AuthModule, DbModule],
  controllers: [ShippingRatesController, AdminShippingRatesController],
  providers: [ShippingRatesRepository, ShippingRatesService],
  exports: [ShippingRatesService],
})
export class ShippingRatesModule {}
