import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  calculatePercentageDiscount,
  moneyToCents,
} from '../common/utils/money.util';
import type { DatabaseExecutor } from '../db/db.module';
import type {
  CreateCouponDto,
  ListCouponsQueryDto,
  UpdateCouponDto,
} from './dto/coupon.dto';
import { CouponsRepository } from './coupons.repository';

@Injectable()
export class CouponsService {
  constructor(private readonly couponsRepository: CouponsRepository) {}

  findAll(filters: ListCouponsQueryDto) {
    return this.couponsRepository.findAll(filters);
  }

  async findOne(id: string) {
    const [coupon] = await this.couponsRepository.findById(id);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async create(payload: CreateCouponDto) {
    await this.ensureCodeIsAvailable(payload.code);

    const [coupon] = await this.couponsRepository.create({
      code: payload.code,
      percentage: payload.percentage,
      minimumOrder: payload.minimumOrder,
      usageLimit: payload.usageLimit,
      expiresAt: payload.expiresAt,
      isActive: payload.isActive,
    });

    return coupon;
  }

  async update(id: string, payload: UpdateCouponDto) {
    await this.findOne(id);

    if (payload.code) {
      await this.ensureCodeIsAvailable(payload.code, id);
    }

    const [coupon] = await this.couponsRepository.update(id, {
      code: payload.code,
      percentage: payload.percentage,
      minimumOrder: payload.minimumOrder,
      usageLimit: payload.usageLimit,
      expiresAt: payload.expiresAt,
      isActive: payload.isActive,
    });

    return coupon;
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.couponsRepository.delete(id);

    return { id };
  }

  async calculateCheckoutDiscount(
    code: string | undefined,
    subtotalCents: number,
    executor: DatabaseExecutor,
  ) {
    if (!code) {
      return { coupon: null, discountCents: 0 };
    }

    const [coupon] = await this.couponsRepository.findByCode(
      code.toUpperCase(),
      executor,
    );

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Coupon is not available');
    }

    if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (subtotalCents < moneyToCents(coupon.minimumOrder ?? '0')) {
      throw new BadRequestException('Order does not meet coupon minimum');
    }

    if (coupon.usageLimit !== null) {
      const [{ total }] = await this.couponsRepository.countUsages(
        coupon.id,
        executor,
      );

      if (total >= coupon.usageLimit) {
        throw new BadRequestException('Coupon usage limit has been reached');
      }
    }

    return {
      coupon,
      discountCents: calculatePercentageDiscount(
        subtotalCents,
        coupon.percentage ?? '0',
      ),
    };
  }

  recordUsage(
    couponId: string,
    orderId: string,
    customerId: string | undefined,
    executor: DatabaseExecutor,
  ) {
    return this.couponsRepository.createUsage(
      { couponId, orderId, customerId },
      executor,
    );
  }

  releaseUsageForOrder(orderId: string, executor: DatabaseExecutor) {
    return this.couponsRepository.deleteUsageByOrderId(orderId, executor);
  }

  attachOrderUsageCustomer(
    orderId: string,
    customerId: string,
    executor: DatabaseExecutor,
  ) {
    return this.couponsRepository.attachOrderUsageCustomer(
      orderId,
      customerId,
      executor,
    );
  }

  private async ensureCodeIsAvailable(code: string, currentCouponId?: string) {
    const [coupon] = await this.couponsRepository.findByCode(code);

    if (coupon && coupon.id !== currentCouponId) {
      throw new ConflictException('Coupon code already exists');
    }
  }
}
