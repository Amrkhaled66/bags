import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { AdminsService } from '../admins/admins.service';
import { CustomersService } from '../customers/customers.service';
import type {
  CreateCustomerDto,
  UpdateCustomerProfileDto,
} from '../customers/dto/customer.dto';
import type { AdminSigninDto } from './dto/admin-signin.dto';
import type { CustomerSigninDto } from './dto/customer-signin.dto';
import type { AdminJwtPayload } from './types/admin-jwt-payload.type';
import type { AuthenticatedAdmin } from './types/authenticated-admin.type';
import type { AuthenticatedCustomer } from './types/authenticated-customer.type';
import type { CustomerJwtPayload } from './types/customer-jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly customersService: CustomersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async signInAdmin(payload: AdminSigninDto) {
    const admin = await this.adminsService.findByEmailForAuth(payload.email);

    if (!admin?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      admin.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const authenticatedAdmin: AuthenticatedAdmin = {
      id: admin.id,
      email: admin.email ?? payload.email,
      role: admin.role,
    };
    const tokenPayload: AdminJwtPayload = {
      sub: authenticatedAdmin.id,
      email: authenticatedAdmin.email,
      role: authenticatedAdmin.role,
      type: 'admin',
    };

    return {
      accessToken: await this.jwtService.signAsync(tokenPayload, {
        secret: this.getJwtSecret(),
        expiresIn:
          this.configService.get<StringValue>('JWT_EXPIRES_IN') ?? '7d',
      }),
      admin: authenticatedAdmin,
    };
  }

  getAdminProfile(admin: AuthenticatedAdmin) {
    return admin;
  }

  async signUpCustomer(payload: CreateCustomerDto) {
    const customer = await this.customersService.create(payload);
    const authenticatedCustomer: AuthenticatedCustomer = {
      id: customer.id,
      email: customer.email ?? payload.email,
    };

    return {
      accessToken: await this.signCustomerToken(authenticatedCustomer),
      customer,
    };
  }

  async signInCustomer(payload: CustomerSigninDto) {
    const customer = await this.customersService.findByEmailForAuth(
      payload.email,
    );

    if (!customer?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      customer.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const authenticatedCustomer: AuthenticatedCustomer = {
      id: customer.id,
      email: customer.email ?? payload.email,
    };

    return {
      accessToken: await this.signCustomerToken(authenticatedCustomer),
      customer: await this.customersService.findOne(customer.id),
    };
  }

  getCustomerProfile(customer: AuthenticatedCustomer) {
    return this.customersService.findOne(customer.id);
  }

  updateCustomerProfile(
    customer: AuthenticatedCustomer,
    payload: UpdateCustomerProfileDto,
  ) {
    return this.customersService.updateProfile(customer.id, payload);
  }

  private signCustomerToken(customer: AuthenticatedCustomer) {
    const tokenPayload: CustomerJwtPayload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    };

    return this.jwtService.signAsync(tokenPayload, {
      secret: this.getJwtSecret(),
      expiresIn: this.configService.get<StringValue>('JWT_EXPIRES_IN') ?? '7d',
    });
  }

  private getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new UnauthorizedException('JWT secret is not configured');
    }

    return secret;
  }
}
