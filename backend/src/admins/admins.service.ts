import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { AdminsRepository } from './admins.repository';

@Injectable()
export class AdminsService {
  constructor(private readonly adminsRepository: AdminsRepository) {}

  findAll() {
    return this.adminsRepository.findAll();
  }

  async findByEmailForAuth(email: string) {
    const [admin] = await this.adminsRepository.findByEmail(email);

    return admin;
  }

  async findOne(id: string) {
    const [admin] = await this.adminsRepository.findById(id);

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async create(payload: CreateAdminDto) {
    const [existingAdmin] = await this.adminsRepository.findByEmail(
      payload.email,
    );

    if (existingAdmin) {
      throw new ConflictException('Admin email already exists');
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const [admin] = await this.adminsRepository.create({
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: payload.role,
    });

    return admin;
  }

  async update(id: string, payload: UpdateAdminDto) {
    await this.findOne(id);

    if (payload.email) {
      const [existingAdmin] = await this.adminsRepository.findByEmail(
        payload.email,
      );

      if (existingAdmin && existingAdmin.id !== id) {
        throw new ConflictException('Admin email already exists');
      }
    }

    const passwordHash = payload.password
      ? await bcrypt.hash(payload.password, 12)
      : undefined;
    const [admin] = await this.adminsRepository.update(id, {
      name: payload.name,
      email: payload.email,
      role: payload.role,
      ...(passwordHash ? { passwordHash } : {}),
    });

    return admin;
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.adminsRepository.delete(id);

    return { id };
  }
}
