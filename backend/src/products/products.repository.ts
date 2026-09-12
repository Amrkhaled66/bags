import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  lte,
  ilike,
  inArray,
  like,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { db, type Database, type DatabaseExecutor } from '../db/db.module';
import {
  brands,
  categories,
  inventory,
  productCategories,
  products,
  productVariants,
  productVariantImages,
} from '../db/schemas';
import type { ListProductsQueryDto } from './dto/product.dto';
import { searchPattern } from '../common/list-query.schema';
import { paginateQuery } from '../common/paginate-query';

export type ProductRecord = typeof products.$inferSelect;
export type CreateProductRecord = typeof products.$inferInsert;
export type CreateProductVariantRecord = typeof productVariants.$inferInsert;
export type CreateInventoryRecord = typeof inventory.$inferInsert;

const productColumns = {
  id: products.id,
  brandId: products.brandId,
  sku: products.sku,
  name: products.name,
  slug: products.slug,
  description: products.description,
  imageUrl: products.imageUrl,
  sellerPrice: products.sellerPrice,
  originalPrice: products.originalPrice,
  discountedPrice: products.discountedPrice,
  lengthCm: products.lengthCm,
  widthCm: products.widthCm,
  status: products.status,
  isFeatured: products.isFeatured,
  isNewArrival: products.isNewArrival,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
};

const brandColumns = {
  id: brands.id,
  name: brands.name,
  slug: brands.slug,
  description: brands.description,
  logoUrl: brands.logoUrl,
  isActive: brands.isActive,
};

const productVariantColumns = {
  id: productVariants.id,
  productId: productVariants.productId,
  colorName: productVariants.colorName,
  sku: productVariants.sku,
  imageUrl: productVariants.imageUrl,
  isActive: productVariants.isActive,
  createdAt: productVariants.createdAt,
  updatedAt: productVariants.updatedAt,
};

const inventoryColumns = {
  variantId: inventory.variantId,
  stockQuantity: inventory.stockQuantity,
  reservedQuantity: inventory.reservedQuantity,
  updatedAt: inventory.updatedAt,
};

@Injectable()
export class ProductsRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  findImages(variantId: string) {
    return this.database
      .select()
      .from(productVariantImages)
      .where(eq(productVariantImages.variantId, variantId))
      .orderBy(productVariantImages.sortOrder);
  }

  findGalleryReferences(filename: string) {
    return this.database
      .select({ id: productVariantImages.id })
      .from(productVariantImages)
      .where(
        like(productVariantImages.imageUrl, `%/uploads/images/${filename}%`),
      )
      .limit(1);
  }

  replaceImages(productId: string, variantId: string, imageUrls: string[]) {
    return this.database.transaction(async (tx) => {
      const [variant] = await tx
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.id, variantId),
            eq(productVariants.productId, productId),
          ),
        )
        .for('update');
      if (!variant) return null;
      await tx
        .delete(productVariantImages)
        .where(eq(productVariantImages.variantId, variantId));
      const images = imageUrls.length
        ? await tx
            .insert(productVariantImages)
            .values(
              imageUrls.map((imageUrl, sortOrder) => ({
                variantId,
                imageUrl,
                sortOrder,
              })),
            )
            .returning()
        : [];
      await tx
        .update(productVariants)
        .set({ imageUrl: imageUrls[0] ?? null, updatedAt: new Date() })
        .where(eq(productVariants.id, variantId));
      return images.sort((a, b) => a.sortOrder - b.sortOrder);
    });
  }

  findImageReferences(filename: string) {
    const productImageReferences = this.database
      .select({ id: products.id })
      .from(products)
      .where(like(products.imageUrl, `%/uploads/images/${filename}%`))
      .limit(1);
    const variantImageReferences = this.database
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(like(productVariants.imageUrl, `%/uploads/images/${filename}%`))
      .limit(1);
    return Promise.all([productImageReferences, variantImageReferences]).then(
      ([productReferences, variantReferences]) => [
        ...productReferences,
        ...variantReferences,
      ],
    );
  }

  findAll(filters: ListProductsQueryDto) {
    const conditions: SQL[] = [];
    let query = this.database
      .selectDistinct({ ...productColumns, brand: brandColumns })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .$dynamic();

    if (filters.categoryId) {
      query = query.innerJoin(
        productCategories,
        eq(productCategories.productId, products.id),
      );
      conditions.push(eq(productCategories.categoryId, filters.categoryId));
    }

    if (filters.brandId) {
      conditions.push(eq(products.brandId, filters.brandId));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(products.name, searchPattern(filters.search)),
          ilike(products.slug, searchPattern(filters.search)),
          ilike(products.sku, searchPattern(filters.search)),
        )!,
      );
    }

    if (filters.status) {
      conditions.push(eq(products.status, filters.status));
    }

    if (filters.isFeatured !== undefined) {
      conditions.push(eq(products.isFeatured, filters.isFeatured));
    }

    if (filters.isNewArrival !== undefined) {
      conditions.push(eq(products.isNewArrival, filters.isNewArrival));
    }

    if (filters.from) conditions.push(gte(products.createdAt, filters.from));
    if (filters.to) conditions.push(lte(products.createdAt, filters.to));
    const sort = filters.sortOrder === 'asc' ? asc : desc;
    return paginateQuery(
      this.database,
      query
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(sort(products[filters.sortBy]), sort(products.id)),
      filters,
    );
  }

  getDashboardSummary(lowStockThreshold: number) {
    const availableStock = sql`coalesce(${inventory.stockQuantity}, 0) - coalesce(${inventory.reservedQuantity}, 0)`;

    return Promise.all([
      this.database.select({ total: count() }).from(products),
      this.database
        .select({
          lowStock: sql<number>`count(*) filter (where ${availableStock} > 0 and ${availableStock} <= ${lowStockThreshold})::int`,
          outOfStock: sql<number>`count(*) filter (where ${availableStock} <= 0)::int`,
        })
        .from(productVariants)
        .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(
          and(
            eq(productVariants.isActive, true),
            eq(products.status, 'active'),
          ),
        ),
    ]);
  }

  findById(id: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select({ ...productColumns, brand: brandColumns })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(eq(products.id, id))
      .limit(1);
  }

  findBySlug(slug: string) {
    return this.database
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
  }

  findBySku(sku: string) {
    return this.database
      .select()
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);
  }

  findCategoriesByProductId(productId: string) {
    return this.database
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        imageUrl: categories.imageUrl,
      })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(eq(productCategories.productId, productId));
  }

  findVariantsByProductId(productId: string, activeOnly = false) {
    const conditions: SQL[] = [eq(productVariants.productId, productId)];
    if (activeOnly) conditions.push(eq(productVariants.isActive, true));

    return this.database
      .select({
        ...productVariantColumns,
        stockQuantity: inventory.stockQuantity,
        reservedQuantity: inventory.reservedQuantity,
      })
      .from(productVariants)
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(and(...conditions))
      .orderBy(desc(productVariants.createdAt));
  }

  findVariantById(
    variantId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select({
        ...productVariantColumns,
        stockQuantity: inventory.stockQuantity,
        reservedQuantity: inventory.reservedQuantity,
      })
      .from(productVariants)
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(eq(productVariants.id, variantId))
      .limit(1);
  }

  reserveInventory(
    variantId: string,
    quantity: number,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .update(inventory)
      .set({
        reservedQuantity: sql`coalesce(${inventory.reservedQuantity}, 0) + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventory.variantId, variantId),
          sql`coalesce(${inventory.stockQuantity}, 0) - coalesce(${inventory.reservedQuantity}, 0) >= ${quantity}`,
        ),
      )
      .returning(inventoryColumns);
  }

  releaseReservedInventory(
    variantId: string,
    quantity: number,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .update(inventory)
      .set({
        reservedQuantity: sql`coalesce(${inventory.reservedQuantity}, 0) - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventory.variantId, variantId),
          sql`coalesce(${inventory.reservedQuantity}, 0) >= ${quantity}`,
        ),
      )
      .returning(inventoryColumns);
  }

  commitReservedInventory(
    variantId: string,
    quantity: number,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .update(inventory)
      .set({
        stockQuantity: sql`coalesce(${inventory.stockQuantity}, 0) - ${quantity}`,
        reservedQuantity: sql`coalesce(${inventory.reservedQuantity}, 0) - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventory.variantId, variantId),
          sql`coalesce(${inventory.stockQuantity}, 0) >= ${quantity}`,
          sql`coalesce(${inventory.reservedQuantity}, 0) >= ${quantity}`,
        ),
      )
      .returning(inventoryColumns);
  }

  restoreInventory(
    variantId: string,
    quantity: number,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .update(inventory)
      .set({
        stockQuantity: sql`coalesce(${inventory.stockQuantity}, 0) + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(inventory.variantId, variantId))
      .returning(inventoryColumns);
  }

  findVariantBySku(sku: string) {
    return this.database
      .select()
      .from(productVariants)
      .where(eq(productVariants.sku, sku))
      .limit(1);
  }

  create(values: CreateProductRecord) {
    return this.database
      .insert(products)
      .values(values)
      .returning(productColumns);
  }

  createVariant(values: CreateProductVariantRecord) {
    return this.database.transaction(async (tx) => {
      const records = await tx
        .insert(productVariants)
        .values(values)
        .returning(productVariantColumns);
      if (values.imageUrl)
        await tx.insert(productVariantImages).values({
          variantId: records[0].id,
          imageUrl: values.imageUrl,
          sortOrder: 0,
        });
      return records;
    });
  }

  createInventory(values: CreateInventoryRecord) {
    return this.database
      .insert(inventory)
      .values(values)
      .returning(inventoryColumns);
  }

  update(id: string, values: Partial<CreateProductRecord>) {
    return this.database
      .update(products)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning(productColumns);
  }

  updateVariant(id: string, values: Partial<CreateProductVariantRecord>) {
    return this.database.transaction(async (tx) => {
      const records = await tx
        .update(productVariants)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(productVariants.id, id))
        .returning(productVariantColumns);
      if (values.imageUrl !== undefined && records.length) {
        // Legacy imageUrl writes replace the gallery with that single image.
        await tx
          .delete(productVariantImages)
          .where(eq(productVariantImages.variantId, id));
        if (values.imageUrl)
          await tx
            .insert(productVariantImages)
            .values({ variantId: id, imageUrl: values.imageUrl, sortOrder: 0 });
      }
      return records;
    });
  }

  updateInventory(variantId: string, values: Partial<CreateInventoryRecord>) {
    return this.database
      .update(inventory)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(inventory.variantId, variantId))
      .returning(inventoryColumns);
  }

  async deleteVariant(id: string) {
    await this.database.delete(inventory).where(eq(inventory.variantId, id));

    return this.database
      .delete(productVariants)
      .where(eq(productVariants.id, id))
      .returning({ id: productVariants.id });
  }

  async replaceCategories(productId: string, categoryIds: string[]) {
    await this.database
      .delete(productCategories)
      .where(eq(productCategories.productId, productId));

    if (categoryIds.length === 0) {
      return;
    }

    await this.database.insert(productCategories).values(
      categoryIds.map((categoryId) => ({
        productId,
        categoryId,
      })),
    );
  }

  async delete(id: string) {
    await this.database
      .delete(productCategories)
      .where(eq(productCategories.productId, id));

    const productVariantIds = await this.database
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, id));

    if (productVariantIds.length > 0) {
      await this.database.delete(inventory).where(
        inArray(
          inventory.variantId,
          productVariantIds.map((variant) => variant.id),
        ),
      );
    }

    await this.database
      .delete(productVariants)
      .where(eq(productVariants.productId, id));

    return this.database
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
  }
}
