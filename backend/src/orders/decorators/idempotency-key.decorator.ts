import {
  BadRequestException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { idempotencyKeySchema } from '../dto/order.dto';

export const IdempotencyKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const result = idempotencyKeySchema.safeParse(
      request.headers['idempotency-key'],
    );

    if (!result.success) {
      throw new BadRequestException('A valid Idempotency-Key is required');
    }

    return result.data;
  },
);
