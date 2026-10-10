import { join } from 'node:path';

export const ACCESS_COOKIE = 'Authentication';

export const MIME_TYPES_EXTENSIONS: Partial<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export const PRODUCT_IMAGES_DIR = join(process.cwd(), 'public', 'products');
