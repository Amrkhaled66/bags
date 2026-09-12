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
import { BrandsService } from './brands.service';
import {
  brandIdSchema,
  createBrandSchema,
  listBrandsQuerySchema,
  updateBrandSchema,
  type CreateBrandDto,
  type ListBrandsQueryDto,
  type UpdateBrandDto,
} from './dto/brand.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/brands')
export class AdminBrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  findAll(
    @Query({ schema: listBrandsQuerySchema }) filters: ListBrandsQueryDto,
  ) {
    return this.brandsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', { schema: brandIdSchema }) id: string) {
    return this.brandsService.findOne(id);
  }

  @Post()
  create(@Body({ schema: createBrandSchema }) payload: CreateBrandDto) {
    return this.brandsService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', { schema: brandIdSchema }) id: string,
    @Body({ schema: updateBrandSchema }) payload: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, payload);
  }

  @Delete(':id')
  delete(@Param('id', { schema: brandIdSchema }) id: string) {
    return this.brandsService.delete(id);
  }
}
