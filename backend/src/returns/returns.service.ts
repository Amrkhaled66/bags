import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedCustomer } from '../auth/types/authenticated-customer.type';
import { centsToMoney, moneyToCents } from '../common/utils/money.util';
import type { DateRange } from '../common/list-query.schema';
import type { DatabaseExecutor } from '../db/db.module';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { ProductsService } from '../products/products.service';
import type {
  CompleteRefundDto,
  CreateReturnDto,
  ListAdminReturnsQueryDto,
  UpdateReturnStatusDto,
} from './dto/return.dto';
import { ReturnsRepository, type ReturnRecord } from './returns.repository';

type ReturnStatus = ReturnRecord['status'];

const allowedReturnTransitions: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ['approved', 'rejected'],
  approved: ['received'],
  rejected: [],
  received: [],
  completed: [],
};

@Injectable()
export class ReturnsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
    private readonly productsService: ProductsService,
    private readonly returnsRepository: ReturnsRepository,
  ) {}

  create(
    customer: AuthenticatedCustomer | undefined,
    accessToken: string | undefined,
    payload: CreateReturnDto,
  ) {
    return this.returnsRepository.transaction(async (tx) => {
      const order = await this.ordersService.findAccessibleOrder(
        payload.orderNumber,
        customer,
        accessToken,
        tx,
      );

      this.ensureOrderIsReturnable(order.status, order.shipment?.deliveredAt);

      const orderItemsById = new Map(
        order.items.map((item) => [item.id, item]),
      );
      const requestedOrderItemIds = payload.items.map(
        (item) => item.orderItemId,
      );
      const previouslyRequested =
        await this.returnsRepository.findPreviouslyRequestedQuantities(
          requestedOrderItemIds,
          tx,
        );
      const previouslyRequestedByItemId = new Map(
        previouslyRequested.map((item) => [
          item.orderItemId,
          Number(item.quantity ?? 0),
        ]),
      );

      for (const requestedItem of payload.items) {
        const orderItem = orderItemsById.get(requestedItem.orderItemId);

        if (!orderItem || !orderItem.quantity) {
          throw new BadRequestException(
            'A requested item does not belong to this order',
          );
        }

        const previousQuantity =
          previouslyRequestedByItemId.get(requestedItem.orderItemId) ?? 0;

        if (previousQuantity + requestedItem.quantity > orderItem.quantity) {
          throw new BadRequestException(
            'Return quantity exceeds the remaining purchased quantity',
          );
        }
      }

      const [returnRecord] = await this.returnsRepository.create(
        {
          orderId: order.id,
          status: 'requested',
          reason: payload.reason,
        },
        tx,
      );
      await this.returnsRepository.createItems(
        payload.items.map((item) => ({
          returnId: returnRecord.id,
          orderItemId: item.orderItemId,
          quantity: item.quantity,
        })),
        tx,
      );

      const [createdReturn] = await this.returnsRepository.findById(
        returnRecord.id,
        tx,
      );

      return this.formatReturn(createdReturn, tx);
    });
  }

  findCustomerReturns(customer: AuthenticatedCustomer) {
    return this.returnsRepository.findByCustomerId(customer.id);
  }

  async findAccessibleReturn(
    id: string,
    customer: AuthenticatedCustomer | undefined,
    accessToken: string | undefined,
  ) {
    const returnRecord = await this.findRequiredReturn(id);

    if (!returnRecord.orderNumber) {
      throw new ConflictException('Return order number is missing');
    }

    await this.ordersService.findAccessibleOrder(
      returnRecord.orderNumber,
      customer,
      accessToken,
    );

    return this.formatReturn(returnRecord);
  }

  findAllForAdmin(filters: ListAdminReturnsQueryDto) {
    return this.returnsRepository.findAll(filters);
  }

  async getDashboardSummary(range: DateRange) {
    const [[[periodCount], [pendingCount]], [refunds]] = await Promise.all([
      this.returnsRepository.getDashboardCounts(range),
      this.returnsRepository.getDashboardRefundTotal(range),
    ]);

    return {
      totalInPeriod: periodCount.total,
      pending: pendingCount.total,
      refunded: refunds.refunded,
    };
  }

  async findOneForAdmin(id: string, executor?: DatabaseExecutor) {
    const returnRecord = await this.findRequiredReturn(id, executor);

    return this.formatReturn(returnRecord, executor);
  }

  updateStatus(id: string, payload: UpdateReturnStatusDto) {
    return this.returnsRepository.transaction(async (tx) => {
      const returnRecord = await this.findRequiredReturn(id, tx);

      if (
        !allowedReturnTransitions[returnRecord.status].includes(payload.status)
      ) {
        throw new BadRequestException(
          `Return cannot move from ${returnRecord.status} to ${payload.status}`,
        );
      }

      if (payload.status === 'received') {
        const items = await this.returnsRepository.findItems(id, tx);

        for (const item of items) {
          if (!item.variantId) {
            throw new ConflictException('Return inventory data is incomplete');
          }

          await this.productsService.restoreInventory(
            item.variantId,
            item.quantity,
            tx,
          );
        }
      }

      await this.returnsRepository.updateStatus(id, payload.status, tx);

      return this.findOneForAdmin(id, tx);
    });
  }

  completeRefund(id: string, payload: CompleteRefundDto) {
    return this.returnsRepository.transaction(async (tx) => {
      const returnRecord = await this.findRequiredReturn(id, tx);

      if (returnRecord.status !== 'received') {
        throw new BadRequestException('Only received returns can be refunded');
      }

      const existingRefunds = await this.returnsRepository.findRefunds(id, tx);

      if (existingRefunds.length > 0) {
        throw new ConflictException('Return has already been refunded');
      }

      const order = await this.ordersService.findOneForAdmin(
        returnRecord.orderId,
        tx,
      );
      const returnItems = await this.returnsRepository.findItems(id, tx);
      const refund = await this.calculateRefund(order, returnItems, tx);

      await this.returnsRepository.createRefund(
        {
          returnId: id,
          amount: centsToMoney(refund.amountCents),
          isRefunded: true,
          refundedAt: new Date(),
          notes: payload.notes,
        },
        tx,
      );
      await this.paymentsService.recordRefund(
        order.id,
        refund.isFullPaymentRefund,
        tx,
      );
      await this.returnsRepository.updateStatus(id, 'completed', tx);

      return this.findOneForAdmin(id, tx);
    });
  }

  private async calculateRefund(
    order: Awaited<ReturnType<OrdersService['findOneForAdmin']>>,
    returnItems: Awaited<ReturnType<ReturnsRepository['findItems']>>,
    executor: DatabaseExecutor,
  ) {
    if (!order.subtotal || !order.payment?.amount) {
      throw new ConflictException('Order payment data is incomplete');
    }

    const subtotalCents = moneyToCents(order.subtotal);
    const discountCents = moneyToCents(order.couponDiscount ?? '0');
    const refundableMerchandiseCents = subtotalCents - discountCents;
    const grossReturnCents = returnItems.reduce((total, item) => {
      if (!item.finalUnitPrice) {
        throw new ConflictException('Return price data is incomplete');
      }

      return total + moneyToCents(item.finalUnitPrice) * item.quantity;
    }, 0);

    const [{ amount: refundedAmount }] =
      await this.returnsRepository.sumRefundedAmountByOrderId(
        order.id,
        executor,
      );
    const previouslyRefundedCents = refundedAmount
      ? moneyToCents(refundedAmount)
      : 0;
    const remainingRefundableCents = Math.max(
      0,
      refundableMerchandiseCents - previouslyRefundedCents,
    );
    const allMerchandiseRefunded = await this.willRefundAllMerchandise(
      order.items,
      returnItems,
      executor,
    );
    const proportionalRefundCents =
      subtotalCents === 0
        ? 0
        : Math.round(
            (grossReturnCents * refundableMerchandiseCents) / subtotalCents,
          );
    const amountCents = allMerchandiseRefunded
      ? remainingRefundableCents
      : Math.min(proportionalRefundCents, remainingRefundableCents);

    if (amountCents <= 0) {
      throw new BadRequestException('No refundable amount remains');
    }

    const totalRefundedCents = previouslyRefundedCents + amountCents;
    const paymentAmountCents = moneyToCents(order.payment.amount);

    return {
      amountCents,
      isFullPaymentRefund: totalRefundedCents >= paymentAmountCents,
    };
  }

  private async willRefundAllMerchandise(
    orderItems: Awaited<ReturnType<OrdersService['findOneForAdmin']>>['items'],
    currentReturnItems: Awaited<ReturnType<ReturnsRepository['findItems']>>,
    executor: DatabaseExecutor,
  ) {
    const orderItemIds = orderItems.map((item) => item.id);
    const refundedQuantities =
      await this.returnsRepository.findRefundedQuantities(
        orderItemIds,
        executor,
      );
    const refundedByOrderItemId = new Map(
      refundedQuantities.map((item) => [
        item.orderItemId,
        Number(item.quantity ?? 0),
      ]),
    );
    const currentByOrderItemId = new Map(
      currentReturnItems.map((item) => [item.orderItemId, item.quantity]),
    );

    return orderItems.every((item) => {
      const orderedQuantity = item.quantity ?? 0;
      const refundedQuantity = refundedByOrderItemId.get(item.id) ?? 0;
      const currentQuantity = currentByOrderItemId.get(item.id) ?? 0;

      return refundedQuantity + currentQuantity >= orderedQuantity;
    });
  }

  private ensureOrderIsReturnable(
    status: string | null,
    deliveredAt: Date | null | undefined,
  ) {
    if (status !== 'delivered' || !deliveredAt) {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    const returnDeadline = new Date(
      deliveredAt.getTime() + 14 * 24 * 60 * 60 * 1000,
    );

    if (new Date() > returnDeadline) {
      throw new BadRequestException('The 14-day return window has expired');
    }
  }

  private async findRequiredReturn(id: string, executor?: DatabaseExecutor) {
    const [returnRecord] = await this.returnsRepository.findById(id, executor);

    if (!returnRecord) {
      throw new NotFoundException('Return not found');
    }

    return returnRecord;
  }

  private async formatReturn(
    returnRecord: Awaited<ReturnType<ReturnsRepository['findById']>>[number],
    executor?: DatabaseExecutor,
  ) {
    const items = await this.returnsRepository.findItems(
      returnRecord.id,
      executor,
    );
    const refunds = await this.returnsRepository.findRefunds(
      returnRecord.id,
      executor,
    );

    return { ...returnRecord, items, refunds };
  }
}
