import { BadRequestException, PipeTransform } from '@nestjs/common';
import { flattenError, ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: flattenError(result.error).fieldErrors,
      });
    }

    return value;
  }
}
