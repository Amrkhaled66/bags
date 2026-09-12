import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { moneyToCents } from '../common/utils/money.util';
import type { DatabaseExecutor } from '../db/db.module';
import type {
  CreateShippingRateDto,
  ListShippingRatesQueryDto,
  UpdateShippingRateDto,
} from './dto/shipping-rate.dto';
import { ShippingRatesRepository } from './shipping-rates.repository';

@Injectable()
export class ShippingRatesService {
  constructor(
    private readonly shippingRatesRepository: ShippingRatesRepository,
  ) {}

  findAll(filters: ListShippingRatesQueryDto) {
    return this.shippingRatesRepository.findAll(filters);
  }

  findAllPublic() {
    return this.shippingRatesRepository.findAll({ isActive: true });
  }

  async findOne(id: string) {
    const [shippingRate] = await this.shippingRatesRepository.findById(id);

    if (!shippingRate) {
      throw new NotFoundException('Shipping rate not found');
    }

    return shippingRate;
  }

  async findOnePublic(id: string) {
    const shippingRate = await this.findOne(id);
    if (!shippingRate.isActive) {
      throw new NotFoundException('Shipping rate not found');
    }
    return shippingRate;
  }

  async findByGovernoratePublic(governorate: string) {
    const shippingRate = await this.findByGovernorate(governorate);
    if (!shippingRate.isActive) {
      throw new NotFoundException('Shipping rate not found');
    }
    return shippingRate;
  }

  async findByGovernorate(governorate: string) {
    const [shippingRate] =
      await this.shippingRatesRepository.findByGovernorate(governorate);

    if (!shippingRate) {
      throw new NotFoundException('Shipping rate not found');
    }

    return shippingRate;
  }

  async create(payload: CreateShippingRateDto) {
    await this.ensureGovernorateIsAvailable(payload.governorate);

    const [shippingRate] = await this.shippingRatesRepository.create({
      governorate: payload.governorate,
      shippingPrice: payload.shippingPrice,
      freeShippingThreshold: payload.freeShippingThreshold,
      isActive: payload.isActive,
    });

    return shippingRate;
  }

  async update(id: string, payload: UpdateShippingRateDto) {
    await this.findOne(id);

    if (payload.governorate) {
      await this.ensureGovernorateIsAvailable(payload.governorate, id);
    }

    const [shippingRate] = await this.shippingRatesRepository.update(id, {
      governorate: payload.governorate,
      shippingPrice: payload.shippingPrice,
      freeShippingThreshold: payload.freeShippingThreshold,
      isActive: payload.isActive,
    });

    return shippingRate;
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.shippingRatesRepository.delete(id);

    return { id };
  }

  async calculateCheckoutShipping(
    governorate: string,
    subtotalCents: number,
    executor: DatabaseExecutor,
  ) {
    const [shippingRate] = await this.shippingRatesRepository.findByGovernorate(
      governorate,
      executor,
    );

    if (!shippingRate || !shippingRate.isActive) {
      throw new BadRequestException(
        'Shipping is not available for this governorate',
      );
    }

    const freeShippingThreshold = shippingRate.freeShippingThreshold
      ? moneyToCents(shippingRate.freeShippingThreshold)
      : null;
    const hasFreeShipping =
      freeShippingThreshold !== null && subtotalCents >= freeShippingThreshold;

    return {
      shippingRate,
      shippingCents: hasFreeShipping
        ? 0
        : moneyToCents(shippingRate.shippingPrice ?? '0'),
    };
  }

  private async ensureGovernorateIsAvailable(
    governorate: string,
    currentShippingRateId?: string,
  ) {
    const [shippingRate] =
      await this.shippingRatesRepository.findByGovernorate(governorate);

    if (shippingRate && shippingRate.id !== currentShippingRateId) {
      throw new ConflictException('Shipping rate governorate already exists');
    }
  }
}
