import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { hostname } from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log(`Application is running on: http://${hostname}:3000`);
}
bootstrap();
