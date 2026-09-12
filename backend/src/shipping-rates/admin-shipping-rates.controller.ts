import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import {
  createShippingRateSchema,
  listShippingRatesQuerySchema,
  shippingRateIdSchema,
  updateShippingRateSchema,
  type CreateShippingRateDto,
  type ListShippingRatesQueryDto,
  type UpdateShippingRateDto,
} from './dto/shipping-rate.dto';
import { ShippingRatesService } from './shipping-rates.service';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/shipping-rates')
export class AdminShippingRatesController {
  constructor(private readonly shippingRatesService: ShippingRatesService) {}

  @Get()
  findAll(
    @Query({ schema: listShippingRatesQuerySchema })
    filters: ListShippingRatesQueryDto,
  ) {
    return this.shippingRatesService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', { schema: shippingRateIdSchema }) id: string) {
    return this.shippingRatesService.findOne(id);
  }

  @Post()
  create(
    @Body({ schema: createShippingRateSchema }) payload: CreateShippingRateDto,
  ) {
    return this.shippingRatesService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', { schema: shippingRateIdSchema }) id: string,
    @Body({ schema: updateShippingRateSchema }) payload: UpdateShippingRateDto,
  ) {
    return this.shippingRatesService.update(id, payload);
  }

  @Delete(':id')
  delete(@Param('id', { schema: shippingRateIdSchema }) id: string) {
    return this.shippingRatesService.delete(id);
  }
}
