import { Injectable } from '@nestjs/common';
import { ProductDto } from '../dtos/products.dto';
import { PublicUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '../generated/prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createProduct(
    body: ProductDto,
    userId: PublicUser['id'],
  ): Promise<Product> {
    console.log({
      ...body,
      userId,
    });
    return this.prismaService.product.create({
      data: {
        ...body,
        userId,
      },
    });
  }

  async getProducts(): Promise<Product[]> {
    return this.prismaService.product.findMany();
  }
}
