import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { OrderReservationsJob } from './order-reservations.job';

@Module({
  imports: [OrdersModule],
  providers: [OrderReservationsJob],
})
export class MaintenanceModule {}
