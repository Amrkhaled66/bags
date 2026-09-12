import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestWithCustomer } from '../types/request-with-customer.type';

export const CurrentCustomer = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithCustomer>();

    return request.customer;
  },
);
