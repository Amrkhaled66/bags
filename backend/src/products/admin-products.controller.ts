import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import {
  createProductSchema,
  createProductVariantSchema,
  listProductsQuerySchema,
  productCategoriesSchema,
  productIdSchema,
  productVariantIdSchema,
  updateInventorySchema,
  updateProductSchema,
  updateProductVariantSchema,
  type CreateProductDto,
  type CreateProductVariantDto,
  type ListProductsQueryDto,
  type ProductCategoriesDto,
  type UpdateInventoryDto,
  type UpdateProductDto,
  type UpdateProductVariantDto,
} from './dto/product.dto';
import {
  variantImagesSchema,
  type VariantImagesDto,
} from './dto/variant-images.dto';
import { ProductsService } from './products.service';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query({ schema: listProductsQuerySchema }) filters: ListProductsQueryDto,
  ) {
    return this.productsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', { schema: productIdSchema }) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body({ schema: createProductSchema }) payload: CreateProductDto) {
    return this.productsService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', { schema: productIdSchema }) id: string,
    @Body({ schema: updateProductSchema }) payload: UpdateProductDto,
  ) {
    return this.productsService.update(id, payload);
  }

  @Put(':id/categories')
  replaceCategories(
    @Param('id', { schema: productIdSchema }) id: string,
    @Body({ schema: productCategoriesSchema }) payload: ProductCategoriesDto,
  ) {
    return this.productsService.replaceCategories(id, payload);
  }

  @Get(':id/variants')
  findVariants(@Param('id', { schema: productIdSchema }) id: string) {
    return this.productsService.findVariants(id);
  }

  @Post(':id/variants')
  createVariant(
    @Param('id', { schema: productIdSchema }) id: string,
    @Body({ schema: createProductVariantSchema })
    payload: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(id, payload);
  }

  @Get(':id/variants/:variantId')
  findVariant(
    @Param('id', { schema: productIdSchema }) id: string,
    @Param('variantId', { schema: productVariantIdSchema }) variantId: string,
  ) {
    return this.productsService.findVariant(id, variantId);
  }

  @Patch(':id/variants/:variantId')
  updateVariant(
    @Param('id', { schema: productIdSchema }) id: string,
    @Param('variantId', { schema: productVariantIdSchema }) variantId: string,
    @Body({ schema: updateProductVariantSchema })
    payload: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(id, variantId, payload);
  }

  @Patch(':id/variants/:variantId/inventory')
  updateInventory(
    @Param('id', { schema: productIdSchema }) id: string,
    @Param('variantId', { schema: productVariantIdSchema }) variantId: string,
    @Body({ schema: updateInventorySchema }) payload: UpdateInventoryDto,
  ) {
    return this.productsService.updateInventory(id, variantId, payload);
  }

  @Get(':id/variants/:variantId/images')
  async findImages(
    @Param('id', { schema: productIdSchema }) id: string,
    @Param('variantId', { schema: productVariantIdSchema }) variantId: string,
  ) {
    return (await this.productsService.findVariant(id, variantId)).images;
  }

  @Put(':id/variants/:variantId/images')
  replaceImages(
    @Param('id', { schema: productIdSchema }) id: string,
    @Param('variantId', { schema: productVariantIdSchema }) variantId: string,
    @Body({ schema: variantImagesSchema }) payload: VariantImagesDto,
  ) {
    return this.productsService.replaceVariantImages(id, variantId, payload);
  }

  @Delete(':id/variants/:variantId')
  deleteVariant(
    @Param('id', { schema: productIdSchema }) id: string,
    @Param('variantId', { schema: productVariantIdSchema }) variantId: string,
  ) {
    return this.productsService.deleteVariant(id, variantId);
  }

  @Delete(':id')
  delete(@Param('id', { schema: productIdSchema }) id: string) {
    return this.productsService.delete(id);
  }
}
