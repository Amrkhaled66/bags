import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CategoriesService } from './categories.service';
import {
  categoryIdSchema,
  createCategorySchema,
  type CreateCategoryDto,
  type UpdateCategoryDto,
  updateCategorySchema,
} from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', { schema: categoryIdSchema }) id: string) {
    return this.categoriesService.findOne(id);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Post()
  create(@Body({ schema: createCategorySchema }) payload: CreateCategoryDto) {
    return this.categoriesService.create(payload);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', { schema: categoryIdSchema }) id: string,
    @Body({ schema: updateCategorySchema }) payload: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, payload);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Delete(':id')
  delete(@Param('id', { schema: categoryIdSchema }) id: string) {
    return this.categoriesService.delete(id);
  }
}
