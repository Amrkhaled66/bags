import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { BrandsService } from '../brands/brands.service';
import type { DatabaseExecutor } from '../db/db.module';
import type {
  CreateProductDto,
  CreateProductVariantDto,
  ListProductsQueryDto,
  ListPublicProductsQueryDto,
  ProductCategoriesDto,
  UpdateInventoryDto,
  UpdateProductDto,
  UpdateProductVariantDto,
} from './dto/product.dto';
import { ProductsRepository } from './products.repository';
import type { VariantImagesDto } from './dto/variant-images.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly categoriesService: CategoriesService,
    private readonly productsRepository: ProductsRepository,
  ) {}

  findAll(filters: ListProductsQueryDto) {
    return this.productsRepository.findAll(filters);
  }

  findAllPublic(filters: ListPublicProductsQueryDto) {
    return this.productsRepository.findAll({ ...filters, status: 'active' });
  }

  async getDashboardSummary(lowStockThreshold: number) {
    const [[allProducts], [inventorySummary]] =
      await this.productsRepository.getDashboardSummary(lowStockThreshold);

    return {
      products: allProducts.total,
      lowStockVariants: inventorySummary.lowStock,
      outOfStockVariants: inventorySummary.outOfStock,
    };
  }

  async isImageInUse(filename: string) {
    return (
      (await this.productsRepository.findImageReferences(filename)).length >
        0 ||
      (await this.productsRepository.findGalleryReferences(filename)).length > 0
    );
  }

  async findOne(id: string) {
    const [product] = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const categories =
      await this.productsRepository.findCategoriesByProductId(id);

    return { ...product, categories };
  }

  async findOnePublic(id: string) {
    const product = await this.findOne(id);
    if (product.status !== 'active') {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(payload: CreateProductDto) {
    await this.ensureSlugIsAvailable(payload.slug);
    await this.ensureSkuIsAvailable(payload.sku);
    await this.categoriesService.ensureManyExist(payload.categoryIds);
    if (payload.brandId) await this.brandsService.ensureExists(payload.brandId);

    const [product] = await this.productsRepository.create({
      brandId: payload.brandId,
      sku: payload.sku,
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      imageUrl: payload.imageUrl,
      sellerPrice: payload.sellerPrice,
      originalPrice: payload.originalPrice,
      discountedPrice: payload.discountedPrice,
      lengthCm: payload.lengthCm,
      widthCm: payload.widthCm,
      status: payload.status,
      isFeatured: payload.isFeatured,
      isNewArrival: payload.isNewArrival,
    });

    await this.productsRepository.replaceCategories(
      product.id,
      payload.categoryIds,
    );

    return this.findOne(product.id);
  }

  async update(id: string, payload: UpdateProductDto) {
    await this.findOne(id);

    if (payload.slug) {
      await this.ensureSlugIsAvailable(payload.slug, id);
    }

    if (payload.sku) {
      await this.ensureSkuIsAvailable(payload.sku, id);
    }

    if (payload.categoryIds) {
      await this.categoriesService.ensureManyExist(payload.categoryIds);
    }

    if (payload.brandId) {
      await this.brandsService.ensureExists(payload.brandId);
    }

    const [product] = await this.productsRepository.update(id, {
      brandId: payload.brandId,
      sku: payload.sku,
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      imageUrl: payload.imageUrl,
      sellerPrice: payload.sellerPrice,
      originalPrice: payload.originalPrice,
      discountedPrice: payload.discountedPrice,
      lengthCm: payload.lengthCm,
      widthCm: payload.widthCm,
      status: payload.status,
      isFeatured: payload.isFeatured,
      isNewArrival: payload.isNewArrival,
    });

    if (payload.categoryIds) {
      await this.productsRepository.replaceCategories(id, payload.categoryIds);
    }

    return this.findOne(product.id);
  }

  async replaceCategories(id: string, payload: ProductCategoriesDto) {
    await this.findOne(id);
    await this.categoriesService.ensureManyExist(payload.categoryIds);
    await this.productsRepository.replaceCategories(id, payload.categoryIds);

    return this.findOne(id);
  }

  async findVariants(productId: string) {
    await this.findOne(productId);

    const variants =
      await this.productsRepository.findVariantsByProductId(productId);
    return Promise.all(
      variants.map(async (variant) => ({
        ...variant,
        images: await this.productsRepository.findImages(variant.id),
      })),
    );
  }

  async findVariantsPublic(productId: string) {
    await this.findOnePublic(productId);
    const variants = await this.productsRepository.findVariantsByProductId(
      productId,
      true,
    );

    return Promise.all(
      variants.map((variant) => this.toPublicVariant(variant)),
    );
  }

  async findVariant(productId: string, variantId: string) {
    await this.findOne(productId);
    const [variant] = await this.productsRepository.findVariantById(variantId);

    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Product variant not found');
    }

    return {
      ...variant,
      images: await this.productsRepository.findImages(variant.id),
    };
  }

  async findVariantPublic(productId: string, variantId: string) {
    await this.findOnePublic(productId);
    const [variant] = await this.productsRepository.findVariantById(variantId);
    if (
      !variant ||
      variant.productId !== productId ||
      variant.isActive !== true
    ) {
      throw new NotFoundException('Product variant not found');
    }

    return this.toPublicVariant(variant);
  }

  async replaceVariantImages(
    productId: string,
    variantId: string,
    payload: VariantImagesDto,
  ) {
    const images = await this.productsRepository.replaceImages(
      productId,
      variantId,
      payload.imageUrls,
    );
    if (!images) throw new NotFoundException('Product variant not found');
    return { images, imageUrl: images[0]?.imageUrl ?? null };
  }

  async findActiveVariantForCart(
    variantId: string,
    executor?: DatabaseExecutor,
  ) {
    const [variant] = await this.productsRepository.findVariantById(
      variantId,
      executor,
    );

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const [product] = await this.productsRepository.findById(
      variant.productId ?? '',
      executor,
    );

    if (!product || product.status !== 'active' || !variant.isActive) {
      throw new BadRequestException('Product variant is not available');
    }

    return { product, variant };
  }

  async ensureVariantQuantityIsAvailable(
    variantId: string,
    quantity: number,
    executor?: DatabaseExecutor,
  ) {
    const { product, variant } = await this.findActiveVariantForCart(
      variantId,
      executor,
    );
    const stockQuantity = variant.stockQuantity ?? 0;
    const reservedQuantity = variant.reservedQuantity ?? 0;
    const availableQuantity = stockQuantity - reservedQuantity;

    if (quantity > availableQuantity) {
      throw new BadRequestException('Requested quantity is not available');
    }

    return { product, variant, availableQuantity };
  }

  async reserveInventory(
    variantId: string,
    quantity: number,
    executor: DatabaseExecutor,
  ) {
    const [inventoryRecord] = await this.productsRepository.reserveInventory(
      variantId,
      quantity,
      executor,
    );

    if (!inventoryRecord) {
      throw new BadRequestException('Requested quantity is not available');
    }

    return inventoryRecord;
  }

  async releaseReservedInventory(
    variantId: string,
    quantity: number,
    executor: DatabaseExecutor,
  ) {
    const [inventoryRecord] =
      await this.productsRepository.releaseReservedInventory(
        variantId,
        quantity,
        executor,
      );

    if (!inventoryRecord) {
      throw new ConflictException('Inventory reservation is inconsistent');
    }

    return inventoryRecord;
  }

  async commitReservedInventory(
    variantId: string,
    quantity: number,
    executor: DatabaseExecutor,
  ) {
    const [inventoryRecord] =
      await this.productsRepository.commitReservedInventory(
        variantId,
        quantity,
        executor,
      );

    if (!inventoryRecord) {
      throw new ConflictException('Inventory reservation is inconsistent');
    }

    return inventoryRecord;
  }

  async restoreInventory(
    variantId: string,
    quantity: number,
    executor: DatabaseExecutor,
  ) {
    const [inventoryRecord] = await this.productsRepository.restoreInventory(
      variantId,
      quantity,
      executor,
    );

    if (!inventoryRecord) {
      throw new ConflictException('Inventory record was not found');
    }

    return inventoryRecord;
  }

  async createVariant(productId: string, payload: CreateProductVariantDto) {
    await this.findOne(productId);
    await this.ensureVariantSkuIsAvailable(payload.sku);
    this.ensureInventoryQuantitiesAreValid(
      payload.stockQuantity,
      payload.reservedQuantity,
    );

    const [variant] = await this.productsRepository.createVariant({
      productId,
      colorName: payload.colorName,
      sku: payload.sku,
      imageUrl: payload.imageUrl,
      isActive: payload.isActive,
    });

    await this.productsRepository.createInventory({
      variantId: variant.id,
      stockQuantity: payload.stockQuantity,
      reservedQuantity: payload.reservedQuantity,
    });

    return this.findVariant(productId, variant.id);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    payload: UpdateProductVariantDto,
  ) {
    await this.findVariant(productId, variantId);

    if (payload.sku) {
      await this.ensureVariantSkuIsAvailable(payload.sku, variantId);
    }

    await this.productsRepository.updateVariant(variantId, {
      colorName: payload.colorName,
      sku: payload.sku,
      imageUrl: payload.imageUrl,
      isActive: payload.isActive,
    });

    return this.findVariant(productId, variantId);
  }

  async updateInventory(
    productId: string,
    variantId: string,
    payload: UpdateInventoryDto,
  ) {
    const variant = await this.findVariant(productId, variantId);
    const stockQuantity =
      payload.stockQuantity ?? variant.stockQuantity ?? undefined;
    const reservedQuantity =
      payload.reservedQuantity ?? variant.reservedQuantity ?? undefined;

    this.ensureInventoryQuantitiesAreValid(stockQuantity, reservedQuantity);

    const [updatedInventory] = await this.productsRepository.updateInventory(
      variantId,
      {
        stockQuantity: payload.stockQuantity,
        reservedQuantity: payload.reservedQuantity,
      },
    );

    return updatedInventory;
  }

  async deleteVariant(productId: string, variantId: string) {
    await this.findVariant(productId, variantId);
    await this.productsRepository.deleteVariant(variantId);

    return { id: variantId };
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.productsRepository.delete(id);

    return { id };
  }

  private async ensureSlugIsAvailable(slug: string, currentProductId?: string) {
    const [product] = await this.productsRepository.findBySlug(slug);

    if (product && product.id !== currentProductId) {
      throw new ConflictException('Product slug already exists');
    }
  }

  private async ensureSkuIsAvailable(sku: string, currentProductId?: string) {
    const [product] = await this.productsRepository.findBySku(sku);

    if (product && product.id !== currentProductId) {
      throw new ConflictException('Product SKU already exists');
    }
  }

  private async ensureVariantSkuIsAvailable(
    sku: string,
    currentVariantId?: string,
  ) {
    const [variant] = await this.productsRepository.findVariantBySku(sku);

    if (variant && variant.id !== currentVariantId) {
      throw new ConflictException('Product variant SKU already exists');
    }
  }

  private ensureInventoryQuantitiesAreValid(
    stockQuantity?: number | null,
    reservedQuantity?: number | null,
  ) {
    if (
      stockQuantity !== undefined &&
      stockQuantity !== null &&
      reservedQuantity !== undefined &&
      reservedQuantity !== null &&
      reservedQuantity > stockQuantity
    ) {
      throw new BadRequestException(
        'Reserved quantity cannot exceed stock quantity',
      );
    }
  }

  private async toPublicVariant(
    variant: Awaited<ReturnType<ProductsRepository['findVariantById']>>[number],
  ) {
    const availableQuantity =
      (variant.stockQuantity ?? 0) - (variant.reservedQuantity ?? 0);

    return {
      id: variant.id,
      productId: variant.productId,
      colorName: variant.colorName,
      sku: variant.sku,
      imageUrl: variant.imageUrl,
      isAvailable: availableQuantity > 0,
      images: await this.productsRepository.findImages(variant.id),
    };
  }
}
