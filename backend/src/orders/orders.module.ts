import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CartsModule } from '../carts/carts.module';
import { CouponsModule } from '../coupons/coupons.module';
import { DbModule } from '../db/db.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProductsModule } from '../products/products.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { ShippingRatesModule } from '../shipping-rates/shipping-rates.module';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    AuthModule,
    CartsModule,
    CouponsModule,
    DbModule,
    PaymentsModule,
    ProductsModule,
    ShipmentsModule,
    ShippingRatesModule,
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersRepository, OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
