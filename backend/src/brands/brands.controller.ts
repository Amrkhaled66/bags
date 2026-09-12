import { Controller, Get, Param, Query } from '@nestjs/common';
import { BrandsService } from './brands.service';
import {
  brandSlugSchema,
  listPublicBrandsQuerySchema,
  type ListPublicBrandsQueryDto,
} from './dto/brand.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  findAll(
    @Query({ schema: listPublicBrandsQuerySchema })
    filters: ListPublicBrandsQueryDto,
  ) {
    return this.brandsService.findAllPublic(filters);
  }

  @Get(':slug')
  findOne(@Param('slug', { schema: brandSlugSchema }) slug: string) {
    return this.brandsService.findOnePublic(slug);
  }
}
