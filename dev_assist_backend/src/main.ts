import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Sử dụng cứng port 3005
  await app.listen(3005);
  console.log('Application is running on: http://localhost:3005');
}
bootstrap();
