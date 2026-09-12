import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CustomerJwtPayload } from '../types/customer-jwt-payload.type';
import type { RequestWithCustomer } from '../types/request-with-customer.type';

@Injectable()
export class OptionalCustomerJwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCustomer>();
    const authorization = request.headers.authorization;

    if (authorization === undefined) {
      return true;
    }

    if (!authorization.startsWith('Bearer ') || authorization.length === 7) {
      throw new UnauthorizedException('Invalid authorization token');
    }

    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new UnauthorizedException('JWT secret is not configured');
    }

    try {
      const payload = await this.jwtService.verifyAsync<CustomerJwtPayload>(
        authorization.slice(7),
        { secret },
      );

      if (
        payload.type !== 'customer' ||
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string'
      ) {
        throw new UnauthorizedException('Invalid customer token');
      }

      request.customer = { id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException('Invalid authorization token');
    }

    return true;
  }
}
