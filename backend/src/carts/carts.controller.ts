import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';
import { OptionalCustomerJwtAuthGuard } from '../auth/guards/optional-customer-jwt-auth.guard';
import type { AuthenticatedCustomer } from '../auth/types/authenticated-customer.type';
import { CartToken } from './decorators/cart-token.decorator';
import { CartsService } from './carts.service';
import {
  addCartItemSchema,
  type AddCartItemDto,
  cartItemIdSchema,
  cartSessionSchema,
  type CartSessionDto,
  type UpdateCartItemDto,
  updateCartItemSchema,
} from './dto/cart.dto';

@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post('session')
  createSession(@Body({ schema: cartSessionSchema }) payload: CartSessionDto) {
    return this.cartsService.createSession(payload);
  }

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Get()
  getCart(
    @CurrentCustomer() customer: AuthenticatedCustomer | undefined,
    @CartToken() cartToken: string | undefined,
  ) {
    return this.cartsService.getCart(customer, cartToken);
  }

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Post('items')
  addItem(
    @CurrentCustomer() customer: AuthenticatedCustomer | undefined,
    @CartToken() cartToken: string | undefined,
    @Body({ schema: addCartItemSchema }) payload: AddCartItemDto,
  ) {
    return this.cartsService.addItem(customer, cartToken, payload);
  }

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Patch('items/:itemId')
  updateItem(
    @CurrentCustomer() customer: AuthenticatedCustomer | undefined,
    @CartToken() cartToken: string | undefined,
    @Param('itemId', { schema: cartItemIdSchema }) itemId: string,
    @Body({ schema: updateCartItemSchema }) payload: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(customer, cartToken, itemId, payload);
  }

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Delete('items/:itemId')
  deleteItem(
    @CurrentCustomer() customer: AuthenticatedCustomer | undefined,
    @CartToken() cartToken: string | undefined,
    @Param('itemId', { schema: cartItemIdSchema }) itemId: string,
  ) {
    return this.cartsService.deleteItem(customer, cartToken, itemId);
  }

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Delete()
  clearCart(
    @CurrentCustomer() customer: AuthenticatedCustomer | undefined,
    @CartToken() cartToken: string | undefined,
  ) {
    return this.cartsService.clearCart(customer, cartToken);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Post('merge')
  mergeGuestCart(
    @CurrentCustomer() customer: AuthenticatedCustomer,
    @CartToken() cartToken: string | undefined,
  ) {
    return this.cartsService.mergeGuestCart(customer, cartToken ?? '');
  }
}
