import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DatabaseExecutor } from '../db/db.module';
import type { DateRange } from '../common/list-query.schema';
import type { PaymentStatus, UpdatePaymentStatusDto } from './dto/payment.dto';
import { PaymentsRepository, type PaymentRecord } from './payments.repository';

const allowedPaymentTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['paid', 'failed'],
  paid: ['partially_refunded', 'refunded'],
  failed: ['pending', 'paid'],
  partially_refunded: ['refunded'],
  refunded: [],
};

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  async findByOrderId(orderId: string, executor?: DatabaseExecutor) {
    const [payment] = await this.paymentsRepository.findByOrderId(
      orderId,
      executor,
    );

    return payment ?? null;
  }

  async getDashboardSummary(range: DateRange) {
    const [summary] = await this.paymentsRepository.getDashboardSummary(range);
    return summary;
  }

  createCashOnDelivery(
    orderId: string,
    amount: string,
    executor: DatabaseExecutor,
  ) {
    return this.paymentsRepository.create(
      {
        orderId,
        method: 'cash_on_delivery',
        status: 'pending',
        amount,
      },
      executor,
    );
  }

  async updateStatus(
    orderId: string,
    payload: UpdatePaymentStatusDto,
    executor: DatabaseExecutor,
  ) {
    const payment = await this.findRequiredPayment(orderId, executor);

    if (payment.status === payload.status) {
      return payment;
    }

    this.ensureTransitionIsAllowed(payment, payload.status);
    const [updatedPayment] = await this.paymentsRepository.updateStatus(
      orderId,
      payload.status,
      executor,
    );

    return updatedPayment;
  }

  async markPaidOnDelivery(orderId: string, executor: DatabaseExecutor) {
    const payment = await this.findRequiredPayment(orderId, executor);

    if (payment.status === 'paid') {
      return payment;
    }

    if (payment.method !== 'cash_on_delivery') {
      throw new BadRequestException(
        'Only cash-on-delivery payments are paid on delivery',
      );
    }

    this.ensureTransitionIsAllowed(payment, 'paid');
    const [updatedPayment] = await this.paymentsRepository.updateStatus(
      orderId,
      'paid',
      executor,
    );

    return updatedPayment;
  }

  async recordRefund(
    orderId: string,
    isFullRefund: boolean,
    executor: DatabaseExecutor,
  ) {
    const payment = await this.findRequiredPayment(orderId, executor);
    const nextStatus: PaymentStatus = isFullRefund
      ? 'refunded'
      : 'partially_refunded';

    if (payment.status === nextStatus) {
      return payment;
    }

    this.ensureTransitionIsAllowed(payment, nextStatus);
    const [updatedPayment] = await this.paymentsRepository.updateStatus(
      orderId,
      nextStatus,
      executor,
    );

    return updatedPayment;
  }

  private async findRequiredPayment(
    orderId: string,
    executor: DatabaseExecutor,
  ) {
    const payment = await this.findByOrderId(orderId, executor);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  private ensureTransitionIsAllowed(
    payment: PaymentRecord,
    nextStatus: PaymentStatus,
  ) {
    if (!payment.status) {
      throw new ConflictException('Payment status is missing');
    }

    if (!allowedPaymentTransitions[payment.status].includes(nextStatus)) {
      throw new BadRequestException(
        `Payment cannot move from ${payment.status} to ${nextStatus}`,
      );
    }
  }
}
