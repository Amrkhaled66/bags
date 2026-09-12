import { Controller, Get, Param } from '@nestjs/common';
import {
  governorateParamSchema,
  shippingRateIdSchema,
} from './dto/shipping-rate.dto';
import { ShippingRatesService } from './shipping-rates.service';

@Controller('shipping-rates')
export class ShippingRatesController {
  constructor(private readonly shippingRatesService: ShippingRatesService) {}

  @Get()
  findAll() {
    return this.shippingRatesService.findAllPublic();
  }

  @Get('governorate/:governorate')
  findByGovernorate(
    @Param('governorate', { schema: governorateParamSchema })
    governorate: string,
  ) {
    return this.shippingRatesService.findByGovernoratePublic(governorate);
  }

  @Get(':id')
  findOne(@Param('id', { schema: shippingRateIdSchema }) id: string) {
    return this.shippingRatesService.findOnePublic(id);
  }
}
