import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import {
  couponIdSchema,
  createCouponSchema,
  type CreateCouponDto,
  listCouponsQuerySchema,
  type ListCouponsQueryDto,
  type UpdateCouponDto,
  updateCouponSchema,
} from './dto/coupon.dto';
import { CouponsService } from './coupons.service';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  findAll(
    @Query({ schema: listCouponsQuerySchema }) filters: ListCouponsQueryDto,
  ) {
    return this.couponsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', { schema: couponIdSchema }) id: string) {
    return this.couponsService.findOne(id);
  }

  @Post()
  create(@Body({ schema: createCouponSchema }) payload: CreateCouponDto) {
    return this.couponsService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', { schema: couponIdSchema }) id: string,
    @Body({ schema: updateCouponSchema }) payload: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, payload);
  }

  @Delete(':id')
  delete(@Param('id', { schema: couponIdSchema }) id: string) {
    return this.couponsService.delete(id);
  }
}
