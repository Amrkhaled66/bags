import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  listPublicProductsQuerySchema,
  productIdSchema,
  productVariantIdSchema,
  type ListPublicProductsQueryDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query({ schema: listPublicProductsQuerySchema })
    filters: ListPublicProductsQueryDto,
  ) {
    return this.productsService.findAllPublic(filters);
  }

  @Get(':id')
  findOne(@Param('id', { schema: productIdSchema }) id: string) {
    return this.productsService.findOnePublic(id);
  }

  @Get(':id/variants')
  findVariants(@Param('id', { schema: productIdSchema }) id: string) {
    return this.productsService.findVariantsPublic(id);
  }

  @Get(':id/variants/:variantId')
  findVariant(
    @Param('id', { schema: productIdSchema }) id: string,
    @Param('variantId', { schema: productVariantIdSchema }) variantId: string,
  ) {
    return this.productsService.findVariantPublic(id, variantId);
  }

  @Get(':id/variants/:variantId/images')
  async findImages(
    @Param('id', { schema: productIdSchema }) id: string,
    @Param('variantId', { schema: productVariantIdSchema }) variantId: string,
  ) {
    return (await this.productsService.findVariantPublic(id, variantId)).images;
  }
}
