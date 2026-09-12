import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';
import { OptionalCustomerJwtAuthGuard } from '../auth/guards/optional-customer-jwt-auth.guard';
import type { AuthenticatedCustomer } from '../auth/types/authenticated-customer.type';
import { CartToken } from '../carts/decorators/cart-token.decorator';
import { IdempotencyKey } from './decorators/idempotency-key.decorator';
import {
  checkoutSchema,
  type CheckoutDto,
  orderNumberSchema,
  orderQuoteSchema,
  type OrderQuoteDto,
} from './dto/order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Post('quote')
  quote(
    @CurrentCustomer() customer: AuthenticatedCustomer | undefined,
    @CartToken() cartToken: string | undefined,
    @Body({ schema: orderQuoteSchema }) payload: OrderQuoteDto,
  ) {
    return this.ordersService.quote(customer, cartToken, payload);
  }

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Post('checkout')
  checkout(
    @CurrentCustomer() customer: AuthenticatedCustomer | undefined,
    @CartToken() cartToken: string | undefined,
    @IdempotencyKey() idempotencyKey: string,
    @Body({ schema: checkoutSchema }) payload: CheckoutDto,
  ) {
    return this.ordersService.checkout(
      customer,
      cartToken,
      idempotencyKey,
      payload,
    );
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Post(':orderNumber/claim')
  @HttpCode(200)
  claimGuestOrder(
    @Param('orderNumber', { schema: orderNumberSchema }) orderNumber: string,
    @CurrentCustomer() customer: AuthenticatedCustomer,
    @Headers('x-order-token') accessToken: string | undefined,
  ) {
    return this.ordersService.claimGuestOrder(
      orderNumber,
      customer,
      accessToken,
    );
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Get()
  findCustomerOrders(@CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.ordersService.findCustomerOrders(customer);
  }

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Get(':orderNumber')
  findOrder(
    @Param('orderNumber', { schema: orderNumberSchema }) orderNumber: string,
    @CurrentCustomer() customer: AuthenticatedCustomer | undefined,
    @Headers('x-order-token') accessToken: string | undefined,
  ) {
    return this.ordersService.findAccessibleOrder(
      orderNumber,
      customer,
      accessToken,
    );
  }
}
