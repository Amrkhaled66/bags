import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type { AuthenticatedCustomer } from '../auth/types/authenticated-customer.type';
import { CartsService } from '../carts/carts.service';
import { centsToMoney, moneyToCents } from '../common/utils/money.util';
import type { DateRange } from '../common/list-query.schema';
import { CouponsService } from '../coupons/coupons.service';
import type { DatabaseExecutor, DatabaseTransaction } from '../db/db.module';
import type { UpdatePaymentStatusDto } from '../payments/dto/payment.dto';
import { PaymentsService } from '../payments/payments.service';
import { ProductsService } from '../products/products.service';
import type { UpdateShipmentDto } from '../shipments/dto/shipment.dto';
import { ShipmentsService } from '../shipments/shipments.service';
import { ShippingRatesService } from '../shipping-rates/shipping-rates.service';
import type {
  CheckoutDto,
  ListAdminOrdersQueryDto,
  OrderQuoteDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { OrdersRepository, type OrderRecord } from './orders.repository';

type OrderStatus = NonNullable<OrderRecord['status']>;

const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly cartsService: CartsService,
    private readonly configService: ConfigService,
    private readonly couponsService: CouponsService,
    private readonly ordersRepository: OrdersRepository,
    private readonly paymentsService: PaymentsService,
    private readonly productsService: ProductsService,
    private readonly shipmentsService: ShipmentsService,
    private readonly shippingRatesService: ShippingRatesService,
  ) {}

  quote(
    customer: AuthenticatedCustomer | undefined,
    cartToken: string | undefined,
    payload: OrderQuoteDto,
  ) {
    return this.ordersRepository.transaction((tx) =>
      this.calculateQuote(customer, cartToken, payload, tx),
    );
  }

  checkout(
    customer: AuthenticatedCustomer | undefined,
    cartToken: string | undefined,
    idempotencyKey: string,
    payload: CheckoutDto,
  ) {
    return this.ordersRepository.transaction(async (tx) => {
      const [existingOrder] = await this.ordersRepository.findByIdempotencyKey(
        idempotencyKey,
        tx,
      );
      const accessToken = customer
        ? undefined
        : this.createGuestAccessToken(idempotencyKey);

      if (existingOrder) {
        this.ensureIdempotentOrderOwner(existingOrder, customer);

        return {
          order: await this.formatOrder(existingOrder, tx),
          accessToken,
        };
      }

      const quote = await this.calculateQuote(customer, cartToken, payload, tx);
      const orderId = randomUUID();
      const orderNumber = this.createOrderNumber(orderId);
      const reservationHours =
        this.configService.get<number>('ORDER_RESERVATION_HOURS') ?? 24;
      const reservationExpiresAt = new Date(
        Date.now() + reservationHours * 60 * 60 * 1000,
      );

      for (const item of quote.items) {
        await this.productsService.reserveInventory(
          item.variantId,
          item.quantity,
          tx,
        );
      }

      const [order] = await this.ordersRepository.create(
        {
          id: orderId,
          orderNumber,
          idempotencyKey,
          accessTokenHash: accessToken
            ? this.hashAccessToken(accessToken)
            : null,
          customerId: customer?.id,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerEmail: payload.customerEmail ?? customer?.email,
          governorate: payload.governorate,
          cityArea: payload.cityArea,
          streetAddress: payload.streetAddress,
          status: 'pending',
          subtotal: quote.subtotal,
          couponDiscount: quote.couponDiscount,
          shippingPrice: quote.shippingPrice,
          total: quote.total,
          couponId: quote.coupon?.id,
          reservationExpiresAt,
        },
        tx,
      );

      await this.ordersRepository.createItems(
        quote.items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          colorName: item.colorName,
          sellerPrice: item.sellerPrice,
          originalPrice: item.originalPrice,
          discountedPrice: item.discountedPrice,
          finalUnitPrice: item.finalUnitPrice,
          quantity: item.quantity,
          total: item.total,
        })),
        tx,
      );
      await this.paymentsService.createCashOnDelivery(
        order.id,
        quote.total,
        tx,
      );
      await this.ordersRepository.createStatusHistory(
        { orderId: order.id, status: 'pending' },
        tx,
      );

      if (quote.coupon) {
        await this.couponsService.recordUsage(
          quote.coupon.id,
          order.id,
          customer?.id,
          tx,
        );
      }

      await this.cartsService.clearCartById(quote.cartId, tx);

      return {
        order: await this.formatOrder(order, tx),
        accessToken,
      };
    });
  }

  async findCustomerOrders(customer: AuthenticatedCustomer) {
    const records = await this.ordersRepository.findByCustomerId(customer.id);

    return records.map((order) => this.toPublicOrder(order));
  }

  claimGuestOrder(
    orderNumber: string,
    customer: AuthenticatedCustomer,
    accessToken: string | undefined,
  ) {
    // The row lock serializes claims; each waiting caller sees the committed owner.
    return this.ordersRepository.transaction(async (tx) => {
      const [order] = await this.ordersRepository.lockByOrderNumber(
        orderNumber,
        tx,
      );
      if (!order) throw new NotFoundException('Order not found');
      if (order.customerId === customer.id) return this.formatOrder(order, tx);
      if (order.customerId !== null) {
        throw new ConflictException(
          'Order already belongs to another customer',
        );
      }
      if (!accessToken || !this.isValidAccessToken(order, accessToken)) {
        throw new ForbiddenException('A valid guest order token is required');
      }
      const [claimed] = await this.ordersRepository.attachCustomer(
        order.id,
        customer.id,
        tx,
      );
      await this.couponsService.attachOrderUsageCustomer(
        order.id,
        customer.id,
        tx,
      );
      return this.formatOrder(claimed, tx);
    }, 'read committed');
  }

  async findAccessibleOrder(
    orderNumber: string,
    customer: AuthenticatedCustomer | undefined,
    accessToken: string | undefined,
    executor?: DatabaseExecutor,
  ) {
    const [order] = await this.ordersRepository.findByOrderNumber(
      orderNumber,
      executor,
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (customer?.id !== order.customerId) {
      if (!accessToken || !this.isValidAccessToken(order, accessToken)) {
        throw new ForbiddenException('You cannot access this order');
      }
    }

    return this.formatOrder(order, executor);
  }

  async findAllForAdmin(filters: ListAdminOrdersQueryDto) {
    const records = await this.ordersRepository.findAll(filters);

    return {
      ...records,
      data: records.data.map((order) => this.toPublicOrder(order)),
    };
  }

  async getDashboardSummary(range: DateRange) {
    const [[summary], recentOrders] = await Promise.all([
      this.ordersRepository.getDashboardSummary(range),
      this.ordersRepository.findRecentForDashboard(range, 5),
    ]);

    return {
      total: summary.total,
      grossSales: summary.grossSales,
      byStatus: {
        pending: summary.pending,
        confirmed: summary.confirmed,
        shipped: summary.shipped,
        delivered: summary.delivered,
        cancelled: summary.cancelled,
      },
      recent: recentOrders.map((order) => this.toPublicOrder(order)),
    };
  }

  async findOneForAdmin(id: string, executor?: DatabaseExecutor) {
    const [order] = await this.ordersRepository.findById(id, executor);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrder(order, executor);
  }

  updateStatus(id: string, payload: UpdateOrderStatusDto) {
    return this.ordersRepository.transaction(async (tx) => {
      const [order] = await this.ordersRepository.lockById(id, tx);

      if (!order || !order.status) {
        throw new NotFoundException('Order not found');
      }
      return this.transitionStatus(order, payload.status, tx);
    });
  }

  updateShipment(id: string, payload: UpdateShipmentDto) {
    return this.ordersRepository.transaction(async (tx) => {
      const [order] = await this.ordersRepository.lockById(id, tx);

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== 'confirmed' && order.status !== 'shipped') {
        throw new BadRequestException(
          'Shipment tracking is only available for confirmed orders',
        );
      }

      await this.shipmentsService.setTracking(order.id, payload, tx);

      return this.formatOrder(order, tx);
    });
  }

  updatePayment(id: string, payload: UpdatePaymentStatusDto) {
    return this.ordersRepository.transaction(async (tx) => {
      const [order] = await this.ordersRepository.lockById(id, tx);

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      await this.paymentsService.updateStatus(order.id, payload, tx);

      return this.formatOrder(order, tx);
    });
  }

  async cancelExpiredPendingOrders(limit = 100) {
    const expiresBefore = new Date();
    const expiredOrders = await this.ordersRepository.findExpiredPending(
      expiresBefore,
      limit,
    );
    let cancelledCount = 0;

    for (const order of expiredOrders) {
      try {
        const cancelled = await this.ordersRepository.transaction(
          async (tx) => {
            const [lockedOrder] = await this.ordersRepository.lockById(
              order.id,
              tx,
            );
            if (
              !lockedOrder ||
              lockedOrder.status !== 'pending' ||
              !lockedOrder.reservationExpiresAt ||
              lockedOrder.reservationExpiresAt > expiresBefore
            ) {
              return false;
            }
            await this.transitionStatus(lockedOrder, 'cancelled', tx);
            return true;
          },
        );
        if (cancelled) cancelledCount += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown cancellation error';
        this.logger.warn(`Could not expire order ${order.id}: ${message}`);
      }
    }

    return { found: expiredOrders.length, cancelled: cancelledCount };
  }

  private async transitionStatus(
    order: OrderRecord,
    nextStatus: OrderStatus,
    executor: DatabaseTransaction,
  ) {
    if (!order.status) {
      throw new ConflictException('Order status is missing');
    }
    const currentStatus = order.status;
    if (!allowedStatusTransitions[currentStatus].includes(nextStatus)) {
      throw new BadRequestException(
        `Order cannot move from ${currentStatus} to ${nextStatus}`,
      );
    }
    const items = await this.ordersRepository.findItems(order.id, executor);
    if (currentStatus === 'confirmed' && nextStatus === 'shipped') {
      await this.shipmentsService.markShipped(order.id, executor);
    }
    if (currentStatus === 'shipped' && nextStatus === 'delivered') {
      await this.shipmentsService.markDelivered(order.id, executor);
      await this.paymentsService.markPaidOnDelivery(order.id, executor);
    }
    for (const item of items) {
      if (!item.variantId || !item.quantity) {
        throw new ConflictException('Order inventory data is incomplete');
      }
      if (currentStatus === 'pending' && nextStatus === 'confirmed') {
        await this.productsService.commitReservedInventory(
          item.variantId,
          item.quantity,
          executor,
        );
      } else if (currentStatus === 'pending' && nextStatus === 'cancelled') {
        await this.productsService.releaseReservedInventory(
          item.variantId,
          item.quantity,
          executor,
        );
      } else if (currentStatus === 'confirmed' && nextStatus === 'cancelled') {
        await this.productsService.restoreInventory(
          item.variantId,
          item.quantity,
          executor,
        );
      }
    }
    if (currentStatus === 'pending' && nextStatus === 'cancelled') {
      await this.couponsService.releaseUsageForOrder(order.id, executor);
    }
    const [updatedOrder] = await this.ordersRepository.updateStatus(
      order.id,
      nextStatus,
      executor,
    );
    await this.ordersRepository.createStatusHistory(
      { orderId: order.id, status: nextStatus },
      executor,
    );
    return this.formatOrder(updatedOrder, executor);
  }

  private async calculateQuote(
    customer: AuthenticatedCustomer | undefined,
    cartToken: string | undefined,
    payload: OrderQuoteDto,
    executor: DatabaseExecutor,
  ) {
    const cart = await this.cartsService.getCheckoutCart(
      customer,
      cartToken,
      executor,
    );

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const items: Array<{
      productId: string;
      variantId: string;
      productName: string | null;
      sku: string | null;
      colorName: string | null;
      sellerPrice: string | null;
      originalPrice: string | null;
      discountedPrice: string | null;
      finalUnitPrice: string;
      quantity: number;
      total: string;
    }> = [];

    for (const cartItem of cart.items) {
      if (!cartItem.variantId || !cartItem.quantity) {
        throw new BadRequestException('Cart contains an invalid item');
      }

      const { product, variant } =
        await this.productsService.ensureVariantQuantityIsAvailable(
          cartItem.variantId,
          cartItem.quantity,
          executor,
        );
      const unitPrice = product.discountedPrice ?? product.sellerPrice;

      if (!unitPrice) {
        throw new BadRequestException('Product price is not available');
      }

      items.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        sku: variant.sku,
        colorName: variant.colorName,
        sellerPrice: product.sellerPrice,
        originalPrice: product.originalPrice,
        discountedPrice: product.discountedPrice,
        finalUnitPrice: unitPrice,
        quantity: cartItem.quantity,
        total: centsToMoney(moneyToCents(unitPrice) * cartItem.quantity),
      });
    }

    const subtotalCents = items.reduce(
      (sum, item) => sum + moneyToCents(item.total),
      0,
    );
    const { coupon, discountCents } =
      await this.couponsService.calculateCheckoutDiscount(
        payload.couponCode,
        subtotalCents,
        executor,
      );
    const { shippingRate, shippingCents } =
      await this.shippingRatesService.calculateCheckoutShipping(
        payload.governorate,
        subtotalCents,
        executor,
      );
    const totalCents = subtotalCents - discountCents + shippingCents;

    return {
      cartId: cart.id,
      items,
      subtotal: centsToMoney(subtotalCents),
      couponDiscount: centsToMoney(discountCents),
      shippingPrice: centsToMoney(shippingCents),
      total: centsToMoney(totalCents),
      coupon: coupon
        ? { id: coupon.id, code: coupon.code, percentage: coupon.percentage }
        : null,
      shippingRate: {
        id: shippingRate.id,
        governorate: shippingRate.governorate,
      },
    };
  }

  private async formatOrder(order: OrderRecord, executor?: DatabaseExecutor) {
    const items = await this.ordersRepository.findItems(order.id, executor);
    const payment = await this.paymentsService.findByOrderId(
      order.id,
      executor,
    );
    const shipment = await this.shipmentsService.findByOrderId(
      order.id,
      executor,
    );
    const statusHistory = await this.ordersRepository.findStatusHistory(
      order.id,
      executor,
    );

    return {
      ...this.toPublicOrder(order),
      items,
      payment,
      shipment,
      statusHistory,
    };
  }

  private toPublicOrder(order: OrderRecord) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      governorate: order.governorate,
      cityArea: order.cityArea,
      streetAddress: order.streetAddress,
      status: order.status,
      subtotal: order.subtotal,
      couponDiscount: order.couponDiscount,
      shippingPrice: order.shippingPrice,
      total: order.total,
      couponId: order.couponId,
      reservationExpiresAt: order.reservationExpiresAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private ensureIdempotentOrderOwner(
    order: OrderRecord,
    customer: AuthenticatedCustomer | undefined,
  ) {
    if (order.customerId !== (customer?.id ?? null)) {
      throw new ConflictException('Idempotency key has already been used');
    }
  }

  private createOrderNumber(orderId: string) {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');

    return `BAG-${date}-${orderId.slice(0, 8).toUpperCase()}`;
  }

  private createGuestAccessToken(idempotencyKey: string) {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new InternalServerErrorException('Order token secret is missing');
    }

    return createHmac('sha256', secret)
      .update(`guest-order:${idempotencyKey}`)
      .digest('hex');
  }

  private hashAccessToken(accessToken: string) {
    return createHash('sha256').update(accessToken).digest('hex');
  }

  private isValidAccessToken(order: OrderRecord, accessToken: string) {
    if (
      order.customerId !== null ||
      !order.accessTokenHash ||
      typeof accessToken !== 'string'
    ) {
      return false;
    }

    const expected = Buffer.from(order.accessTokenHash, 'hex');
    const actual = Buffer.from(this.hashAccessToken(accessToken), 'hex');

    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }
}
