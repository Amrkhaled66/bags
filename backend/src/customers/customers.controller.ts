import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CustomersService } from './customers.service';
import {
  customerIdSchema,
  listCustomersQuerySchema,
  type ListCustomersQueryDto,
} from './dto/customer.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(
    @Query({ schema: listCustomersQuerySchema }) filters: ListCustomersQueryDto,
  ) {
    return this.customersService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', { schema: customerIdSchema }) id: string) {
    return this.customersService.findOne(id);
  }
}
