import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import {
  completeRefundSchema,
  type CompleteRefundDto,
  listAdminReturnsQuerySchema,
  type ListAdminReturnsQueryDto,
  returnIdSchema,
  type UpdateReturnStatusDto,
  updateReturnStatusSchema,
} from './dto/return.dto';
import { ReturnsService } from './returns.service';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/returns')
export class AdminReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  findAll(
    @Query({ schema: listAdminReturnsQuerySchema })
    filters: ListAdminReturnsQueryDto,
  ) {
    return this.returnsService.findAllForAdmin(filters);
  }

  @Get(':id')
  findOne(@Param('id', { schema: returnIdSchema }) id: string) {
    return this.returnsService.findOneForAdmin(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', { schema: returnIdSchema }) id: string,
    @Body({ schema: updateReturnStatusSchema }) payload: UpdateReturnStatusDto,
  ) {
    return this.returnsService.updateStatus(id, payload);
  }

  @Post(':id/refund')
  completeRefund(
    @Param('id', { schema: returnIdSchema }) id: string,
    @Body({ schema: completeRefundSchema }) payload: CompleteRefundDto,
  ) {
    return this.returnsService.completeRefund(id, payload);
  }
}
