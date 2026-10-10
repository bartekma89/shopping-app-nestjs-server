import '@nestjs/platform-express/multer/index';

import { PublicUser } from '../auth/types';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
