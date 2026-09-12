import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestWithAdmin } from '../types/request-with-admin.type';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();

    return request.admin;
  },
);
