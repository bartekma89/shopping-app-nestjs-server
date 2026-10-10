import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const MAX_INT32 = 2_147_483_647;

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = Number(value);

    if (!/^\d+$/.test(value) || id < 1 || id > MAX_INT32) {
      throw new BadRequestException('Invalid id');
    }

    return id;
  }
}
