import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for the frontend origin (defaults to localhost:3001)
  const corsOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
