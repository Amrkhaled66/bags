import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { DateRange } from '../common/list-query.schema';
import type {
  CreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerProfileDto,
} from './dto/customer.dto';
import { CustomersRepository } from './customers.repository';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  findAll(filters: ListCustomersQueryDto) {
    return this.customersRepository.findAll(filters);
  }

  async getDashboardSummary(range: DateRange) {
    const [[allCustomers], [newCustomers]] =
      await this.customersRepository.getDashboardSummary(range);

    return { total: allCustomers.total, newInPeriod: newCustomers.total };
  }

  async findOne(id: string) {
    const [customer] = await this.customersRepository.findById(id);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async findByEmailForAuth(email: string) {
    const [customer] = await this.customersRepository.findByEmail(email);

    return customer;
  }

  async create(payload: CreateCustomerDto) {
    const [existingCustomer] = await this.customersRepository.findByEmail(
      payload.email,
    );

    if (existingCustomer) {
      throw new ConflictException('Customer email already exists');
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const [customer] = await this.customersRepository.create({
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      passwordHash,
      governorate: payload.governorate,
      cityArea: payload.cityArea,
      streetAddress: payload.streetAddress,
    });

    return customer;
  }

  async updateProfile(id: string, payload: UpdateCustomerProfileDto) {
    await this.findOne(id);

    const [customer] = await this.customersRepository.update(id, {
      name: payload.name,
      phone: payload.phone,
      governorate: payload.governorate,
      cityArea: payload.cityArea,
      streetAddress: payload.streetAddress,
    });

    return customer;
  }
}
