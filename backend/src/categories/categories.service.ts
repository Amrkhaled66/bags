import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  findAll() {
    return this.categoriesRepository.findAll();
  }

  async isImageInUse(filename: string) {
    return (
      (await this.categoriesRepository.findImageReferences(filename)).length > 0
    );
  }

  async findOne(id: string) {
    const [category] = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async ensureManyExist(categoryIds: string[]) {
    if (categoryIds.length === 0) {
      return;
    }

    const uniqueCategoryIds = [...new Set(categoryIds)];
    const existingCategories =
      await this.categoriesRepository.findIds(uniqueCategoryIds);

    if (existingCategories.length !== uniqueCategoryIds.length) {
      throw new BadRequestException('One or more categories were not found');
    }
  }

  async create(payload: CreateCategoryDto) {
    const [existingCategory] = await this.categoriesRepository.findBySlug(
      payload.slug,
    );

    if (existingCategory) {
      throw new ConflictException('Category slug already exists');
    }

    const [category] = await this.categoriesRepository.create({
      name: payload.name,
      slug: payload.slug,
      imageUrl: payload.imageUrl,
    });

    return category;
  }

  async update(id: string, payload: UpdateCategoryDto) {
    await this.findOne(id);

    if (payload.slug) {
      const [existingCategory] = await this.categoriesRepository.findBySlug(
        payload.slug,
      );

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Category slug already exists');
      }
    }

    const [category] = await this.categoriesRepository.update(id, {
      name: payload.name,
      slug: payload.slug,
      imageUrl: payload.imageUrl,
    });

    return category;
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.categoriesRepository.delete(id);

    return { id };
  }
}
