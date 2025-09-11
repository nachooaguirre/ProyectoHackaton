import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for the frontend origin (defaults to localhost:3001)
  const corsEnv = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

  // Allow multiple origins and wildcard patterns like '*.netlify.app'
  const buildOriginOption = () => {
    if (corsEnv === '*') return true;

    const origins = corsEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (origins.length <= 1) return origins[0] ?? false;

    return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);

      const allowed = origins.some((rule) => {
        if (rule === origin) return true;
        if (rule.startsWith('*.')) {
          const suffix = rule.slice(1); // '.example.com'
          return origin.endsWith(suffix);
        }
        return false;
      });

      callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
    };
  };

  app.enableCors({
    origin: buildOriginOption(),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
