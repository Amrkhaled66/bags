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
import { AdminsService } from './admins.service';
import {
  adminIdSchema,
  createAdminSchema,
  type CreateAdminDto,
  type UpdateAdminDto,
  updateAdminSchema,
} from './dto/admin.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  findAll() {
    return this.adminsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', { schema: adminIdSchema }) id: string) {
    return this.adminsService.findOne(id);
  }

  @Post()
  create(@Body({ schema: createAdminSchema }) payload: CreateAdminDto) {
    return this.adminsService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', { schema: adminIdSchema }) id: string,
    @Body({ schema: updateAdminSchema }) payload: UpdateAdminDto,
  ) {
    return this.adminsService.update(id, payload);
  }

  @Delete(':id')
  delete(@Param('id', { schema: adminIdSchema }) id: string) {
    return this.adminsService.delete(id);
  }
}
