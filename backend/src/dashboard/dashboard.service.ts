import { Injectable } from '@nestjs/common';
import { centsToMoney, moneyToCents } from '../common/utils/money.util';
import { CustomersService } from '../customers/customers.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { ProductsService } from '../products/products.service';
import { ReturnsService } from '../returns/returns.service';
import type { DashboardOverviewQueryDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
    private readonly productsService: ProductsService,
    private readonly returnsService: ReturnsService,
  ) {}

  async getOverview(query: DashboardOverviewQueryDto) {
    const period = { from: query.from, to: query.to };
    const [customers, orders, payments, products, returns] = await Promise.all([
      this.customersService.getDashboardSummary(period),
      this.ordersService.getDashboardSummary(period),
      this.paymentsService.getDashboardSummary(period),
      this.productsService.getDashboardSummary(query.lowStockThreshold),
      this.returnsService.getDashboardSummary(period),
    ]);
    const netCollectedCents =
      moneyToCents(payments.collected) - moneyToCents(returns.refunded);

    return {
      period: {
        from: query.from ?? null,
        to: query.to ?? null,
      },
      orders,
      payments: {
        collected: payments.collected,
        refunded: returns.refunded,
        netCollected: centsToMoney(netCollectedCents),
      },
      returns: {
        totalInPeriod: returns.totalInPeriod,
        pending: returns.pending,
      },
      customers,
      catalog: {
        ...products,
        lowStockThreshold: query.lowStockThreshold,
      },
    };
  }
}
