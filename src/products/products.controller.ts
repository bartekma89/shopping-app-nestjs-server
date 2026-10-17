import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  type GetProductsQueryDto,
  GetProductsQuerySchema,
  type ProductDto,
  ProductSchema,
} from '../dtos/products.dto';
import { type PublicUser } from '../auth/types';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_IMAGE_SIZE } from '../constants';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';

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
  getProducts(
    @Query(new ZodValidationPipe(GetProductsQuerySchema))
    query: GetProductsQueryDto,
  ) {
    return this.productsService.getProducts(query);
  }

  @Get(':productId')
  @UseGuards(JwtAuthGuard)
  getProduct(@Param('productId', ParseIdPipe) productId: number) {
    return this.productsService.getProduct(productId);
  }

  @Post(':productId/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: MAX_IMAGE_SIZE,
      },
    }),
  )
  uploadProductImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/i,
            overrideMimeType: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('productId', ParseIdPipe) productId: number,
    @CurrentUser() user: PublicUser,
  ) {
    return this.productsService.uploadProductImage(file, productId, user.id);
  }
}
