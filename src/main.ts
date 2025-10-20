/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import passport from 'passport';

const PORT = process.env.PORT ?? 8585;
const ORIGIN = process.env.ORIGIN;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: ["'self'", 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          manifestSrc: ["'self'", 'apollo-server-landing-page.cdn.apollographql.com'],
          frameSrc: ["'self'", 'sandbox.embed.apollographql.com'],
        },
      },
    }),
  );
  app.enableCors({
    origin: ORIGIN,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  // Session
  app.use(
    session({
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: false,
        sameSite: 'lax',
        //httpOnly: true,
        //maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
      },
    }),
  );

  // Passport
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(PORT, () => console.log(`Notre serveur tourne sur le port : ${PORT}`));
}
void bootstrap();
