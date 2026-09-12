import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  createCustomerSchema,
  type CreateCustomerDto,
  type UpdateCustomerProfileDto,
  updateCustomerProfileSchema,
} from '../customers/dto/customer.dto';
import { AuthService } from './auth.service';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { CurrentCustomer } from './decorators/current-customer.decorator';
import { adminSigninSchema, type AdminSigninDto } from './dto/admin-signin.dto';
import {
  customerSigninSchema,
  type CustomerSigninDto,
} from './dto/customer-signin.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import type { AuthenticatedAdmin } from './types/authenticated-admin.type';
import type { AuthenticatedCustomer } from './types/authenticated-customer.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/signin')
  signInAdmin(@Body({ schema: adminSigninSchema }) payload: AdminSigninDto) {
    return this.authService.signInAdmin(payload);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('admin/me')
  getAdminProfile(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.authService.getAdminProfile(admin);
  }

  @Post('customer/signup')
  signUpCustomer(
    @Body({ schema: createCustomerSchema }) payload: CreateCustomerDto,
  ) {
    return this.authService.signUpCustomer(payload);
  }

  @Post('customer/signin')
  signInCustomer(
    @Body({ schema: customerSigninSchema }) payload: CustomerSigninDto,
  ) {
    return this.authService.signInCustomer(payload);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Get('customer/me')
  getCustomerProfile(@CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.authService.getCustomerProfile(customer);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Patch('customer/me')
  updateCustomerProfile(
    @CurrentCustomer() customer: AuthenticatedCustomer,
    @Body({ schema: updateCustomerProfileSchema })
    payload: UpdateCustomerProfileDto,
  ) {
    return this.authService.updateCustomerProfile(customer, payload);
  }
}
