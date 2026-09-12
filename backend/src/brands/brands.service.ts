import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BrandsRepository } from './brands.repository';
import type {
  CreateBrandDto,
  ListBrandsQueryDto,
  ListPublicBrandsQueryDto,
  UpdateBrandDto,
} from './dto/brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly brandsRepository: BrandsRepository) {}

  findAll(filters: ListBrandsQueryDto) {
    return this.brandsRepository.findAll(filters);
  }

  findAllPublic(filters: ListPublicBrandsQueryDto) {
    return this.brandsRepository.findAll({ ...filters, isActive: true });
  }

  async findOne(id: string) {
    const [brand] = await this.brandsRepository.findById(id);
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async findOnePublic(slug: string) {
    const [brand] = await this.brandsRepository.findBySlug(slug);
    if (!brand || !brand.isActive) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  async ensureExists(id: string) {
    return this.findOne(id);
  }

  async isImageInUse(filename: string) {
    return (
      (await this.brandsRepository.findImageReferences(filename)).length > 0
    );
  }

  async create(payload: CreateBrandDto) {
    await this.ensureSlugIsAvailable(payload.slug);
    const [brand] = await this.brandsRepository.create(payload);
    return brand;
  }

  async update(id: string, payload: UpdateBrandDto) {
    await this.findOne(id);
    if (payload.slug) await this.ensureSlugIsAvailable(payload.slug, id);
    const [brand] = await this.brandsRepository.update(id, payload);
    return brand;
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.brandsRepository.delete(id);
    return { id };
  }

  private async ensureSlugIsAvailable(slug: string, currentBrandId?: string) {
    const [brand] = await this.brandsRepository.findBySlug(slug);
    if (brand && brand.id !== currentBrandId) {
      throw new ConflictException('Brand slug already exists');
    }
  }
}
