import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DatabaseExecutor } from '../db/db.module';
import type { UpdateShipmentDto } from './dto/shipment.dto';
import { ShipmentsRepository } from './shipments.repository';

@Injectable()
export class ShipmentsService {
  constructor(private readonly shipmentsRepository: ShipmentsRepository) {}

  async findByOrderId(orderId: string, executor?: DatabaseExecutor) {
    const [shipment] = await this.shipmentsRepository.findByOrderId(
      orderId,
      executor,
    );

    return shipment ?? null;
  }

  async setTracking(
    orderId: string,
    payload: UpdateShipmentDto,
    executor: DatabaseExecutor,
  ) {
    const shipment = await this.findByOrderId(orderId, executor);

    if (shipment) {
      const [updatedShipment] = await this.shipmentsRepository.update(
        orderId,
        { trackingNumber: payload.trackingNumber },
        executor,
      );

      return updatedShipment;
    }

    const [createdShipment] = await this.shipmentsRepository.create(
      { orderId, trackingNumber: payload.trackingNumber },
      executor,
    );

    return createdShipment;
  }

  async markShipped(orderId: string, executor: DatabaseExecutor) {
    const shipment = await this.findRequiredShipment(orderId, executor);

    if (!shipment.trackingNumber) {
      throw new BadRequestException(
        'A tracking number is required before shipping',
      );
    }

    if (shipment.shippedAt) {
      return shipment;
    }

    const [updatedShipment] = await this.shipmentsRepository.update(
      orderId,
      { shippedAt: new Date() },
      executor,
    );

    return updatedShipment;
  }

  async markDelivered(orderId: string, executor: DatabaseExecutor) {
    const shipment = await this.findRequiredShipment(orderId, executor);

    if (!shipment.shippedAt) {
      throw new BadRequestException('Order must be shipped before delivery');
    }

    if (shipment.deliveredAt) {
      return shipment;
    }

    const [updatedShipment] = await this.shipmentsRepository.update(
      orderId,
      { deliveredAt: new Date() },
      executor,
    );

    return updatedShipment;
  }

  private async findRequiredShipment(
    orderId: string,
    executor: DatabaseExecutor,
  ) {
    const shipment = await this.findByOrderId(orderId, executor);

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }
}
