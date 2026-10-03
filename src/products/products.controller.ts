import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { type ProductDto, ProductSchema } from '../dtos/products.dto';
import { type PublicUser } from '../auth/types';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createProduct(
    @Body(new ZodValidationPipe(ProductSchema)) body: ProductDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.productsService.createProduct(body, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getProducts() {
    return this.productsService.getProducts();
  }
}
