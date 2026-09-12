import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import {
  dashboardOverviewQuerySchema,
  type DashboardOverviewQueryDto,
} from './dto/dashboard.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(
    @Query({ schema: dashboardOverviewQuerySchema })
    query: DashboardOverviewQueryDto,
  ) {
    return this.dashboardService.getOverview(query);
  }
}
