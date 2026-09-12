import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class OrderReservationsJob {
  private readonly logger = new Logger(OrderReservationsJob.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: 'expire-order-reservations',
    waitForCompletion: true,
  })
  async expireReservations() {
    const result = await this.ordersService.cancelExpiredPendingOrders();

    if (result.found > 0) {
      this.logger.log(
        `Expired ${result.cancelled} of ${result.found} pending orders`,
      );
    }
  }
}
