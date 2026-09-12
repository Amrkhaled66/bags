import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import {
  type UpdatePaymentStatusDto,
  updatePaymentStatusSchema,
} from '../payments/dto/payment.dto';
import {
  type UpdateShipmentDto,
  updateShipmentSchema,
} from '../shipments/dto/shipment.dto';
import {
  listAdminOrdersQuerySchema,
  type ListAdminOrdersQueryDto,
  orderIdSchema,
  type UpdateOrderStatusDto,
  updateOrderStatusSchema,
} from './dto/order.dto';
import { OrdersService } from './orders.service';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(
    @Query({ schema: listAdminOrdersQuerySchema })
    filters: ListAdminOrdersQueryDto,
  ) {
    return this.ordersService.findAllForAdmin(filters);
  }

  @Get(':id')
  findOne(@Param('id', { schema: orderIdSchema }) id: string) {
    return this.ordersService.findOneForAdmin(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', { schema: orderIdSchema }) id: string,
    @Body({ schema: updateOrderStatusSchema }) payload: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, payload);
  }

  @Patch(':id/shipment')
  updateShipment(
    @Param('id', { schema: orderIdSchema }) id: string,
    @Body({ schema: updateShipmentSchema }) payload: UpdateShipmentDto,
  ) {
    return this.ordersService.updateShipment(id, payload);
  }

  @Patch(':id/payment')
  updatePayment(
    @Param('id', { schema: orderIdSchema }) id: string,
    @Body({ schema: updatePaymentStatusSchema })
    payload: UpdatePaymentStatusDto,
  ) {
    return this.ordersService.updatePayment(id, payload);
  }
}
