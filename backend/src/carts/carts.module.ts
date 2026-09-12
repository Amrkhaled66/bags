import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DbModule } from '../db/db.module';
import { ProductsModule } from '../products/products.module';
import { CartsController } from './carts.controller';
import { CartsRepository } from './carts.repository';
import { CartsService } from './carts.service';

@Module({
  imports: [AuthModule, DbModule, ProductsModule],
  controllers: [CartsController],
  providers: [CartsRepository, CartsService],
  exports: [CartsService],
})
export class CartsModule {}
