import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';
import { OptionalCustomerJwtAuthGuard } from '../auth/guards/optional-customer-jwt-auth.guard';
import type { AuthenticatedCustomer } from '../auth/types/authenticated-customer.type';
import {
  createReturnSchema,
  type CreateReturnDto,
  returnIdSchema,
} from './dto/return.dto';
import { ReturnsService } from './returns.service';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Post()
  create(
    @CurrentCustomer() customer: AuthenticatedCustomer | undefined,
    @Headers('x-order-token') accessToken: string | undefined,
    @Body({ schema: createReturnSchema }) payload: CreateReturnDto,
  ) {
    return this.returnsService.create(customer, accessToken, payload);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Get()
  findCustomerReturns(@CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.returnsService.findCustomerReturns(customer);
  }

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', { schema: returnIdSchema }) id: string,
    @CurrentCustomer() customer: AuthenticatedCustomer | undefined,
    @Headers('x-order-token') accessToken: string | undefined,
  ) {
    return this.returnsService.findAccessibleReturn(id, customer, accessToken);
  }
}
