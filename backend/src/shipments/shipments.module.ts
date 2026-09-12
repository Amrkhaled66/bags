import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ShipmentsRepository } from './shipments.repository';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [DbModule],
  providers: [ShipmentsRepository, ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
