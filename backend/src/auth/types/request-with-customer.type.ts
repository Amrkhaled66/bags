import type { Request } from 'express';
import type { AuthenticatedCustomer } from './authenticated-customer.type';

export type RequestWithCustomer = Request & {
  customer?: AuthenticatedCustomer;
};
