import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { resolve } from 'path';
import sharp from 'sharp';
import { BrandsService } from '../brands/brands.service';
import { CategoriesService } from '../categories/categories.service';
import { ProductsService } from '../products/products.service';
import { imageFilenameSchema } from '../common/image-url.schema';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class UploadsService {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly categoriesService: CategoriesService,
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
  ) {}

  async upload(file?: Express.Multer.File) {
    if (!file?.buffer?.length)
      throw new BadRequestException('An image file is required');
    if (file.buffer.length > MAX_IMAGE_BYTES)
      throw new PayloadTooLargeException('Maximum image size is 5 MB');
    let result: { data: Buffer; info: sharp.OutputInfo };
    try {
      const input = sharp(file.buffer, {
        limitInputPixels: 25000000,
        failOn: 'warning',
      });
      const metadata = await input.metadata();
      if (
        !['jpeg', 'png', 'webp'].includes(metadata.format ?? '') ||
        (metadata.pages ?? 1) > 1
      ) {
        throw new Error('Unsupported image');
      }
      result = await input
        .rotate()
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new BadRequestException(
        'Provide a valid, non-animated JPEG, PNG or WebP image up to 25 megapixels',
      );
    }
    const filename = `${randomUUID()}.webp`;
    const imageDirectory = this.getImageDirectory();
    await mkdir(imageDirectory, { recursive: true });
    await writeFile(resolve(imageDirectory, filename), result.data, {
      flag: 'wx',
    });
    return {
      filename,
      imageUrl: `/uploads/images/${filename}`,
      mimeType: 'image/webp',
      size: result.data.length,
      width: result.info.width,
      height: result.info.height,
    };
  }

  async delete(filename: string) {
    if (!imageFilenameSchema.safeParse(filename).success)
      throw new BadRequestException('Invalid image filename');
    if (
      (await this.brandsService.isImageInUse(filename)) ||
      (await this.categoriesService.isImageInUse(filename)) ||
      (await this.productsService.isImageInUse(filename))
    ) {
      throw new ConflictException(
        'Image is still used by a brand, category, product or product variant',
      );
    }
    try {
      await unlink(resolve(this.getImageDirectory(), filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw new NotFoundException('Image not found');
      throw error;
    }
    return { filename };
  }

  private getImageDirectory() {
    return resolve(
      process.cwd(),
      this.configService.get<string>('IMAGE_DIRECTORY') ?? 'uploads/images',
    );
  }
}
