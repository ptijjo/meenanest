/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, NestMiddleware } from '@nestjs/common';
import csurf from 'csurf';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly csrfProtection;

  constructor() {
    this.csrfProtection = csurf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      },
    });
  }

  use(req: any, res: any, next: (error?: any) => void) {
    // On ignore les routes d'authentification
    if (req.path.startsWith('/signup') || req.path.startsWith('/login') || req.path.startsWith('/csrf') || req.path.startsWith('/verify-email')) {
      return next();
    }

    this.csrfProtection(req, res, next);
  }
}
