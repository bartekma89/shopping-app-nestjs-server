import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GetProductsQueryDto, ProductDto } from '../dtos/products.dto';
import { PublicUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Product } from '../generated/prisma/client';
import { MIME_TYPES_EXTENSIONS, PRODUCT_IMAGES_DIR } from '../constants';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ProductEventService } from './product-event.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly productEventService: ProductEventService,
  ) {}

  async createProduct(
    body: ProductDto,
    userId: PublicUser['id'],
  ): Promise<Product> {
    const product = await this.prismaService.product.create({
      data: {
        ...body,
        userId,
      },
    });

    this.productEventService.emit({
      type: 'product.created',
      product,
    });

    return product;
  }

  async getProducts(query: GetProductsQueryDto): Promise<Product[]> {
    const { status } = query;
    return this.prismaService.product.findMany({
      where: status ? { sold: status === 'sold' } : undefined,
    });
  }

  async getProduct(id: number): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} does not exist`);
    }

    return product;
  }

  async uploadProductImage(
    file: Express.Multer.File,
    productId: number,
    userId: number,
  ): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: {
        id: productId,
        userId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product does not exist');
    }

    const extension = MIME_TYPES_EXTENSIONS[file.mimetype];

    if (!extension) {
      throw new BadRequestException(
        'Only JPEG, PNG and WebP images are allowed',
      );
    }

    const imageKey = `${randomUUID()}${extension}`;

    await mkdir(`${PRODUCT_IMAGES_DIR}/images`, { recursive: true });
    await writeFile(
      join(`${PRODUCT_IMAGES_DIR}/images`, imageKey),
      file.buffer,
    );

    return this.prismaService.product.update({
      data: {
        imageKey,
      },
      where: {
        id: productId,
      },
    });
  }

  async markAsSold(id: number) {
    try {
      const product = await this.prismaService.product.update({
        where: {
          id,
          sold: false,
        },
        data: {
          sold: true,
        },
      });

      this.productEventService.emit({
        type: 'product.sold',
        productId: product.id,
        sellerId: product.userId,
      });

      this.productEventService.emit({
        type: 'product.purchased',
        name: product.name,
        priceCents: product.priceCents,
        productId: product.id,
        recipientId: product.userId,
      });

      return product;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Product: ${id} not found or has been sold`);
        return;
      }

      throw error;
    }
  }
}
