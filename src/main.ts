if (!process.env.IS_TS_NODE) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('module-alias/register');
}
import { AppModule } from '@app/app/app.module';
import { HttpExceptionFilter } from '@app/common/http.exception.filter';
import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
};
bootstrap();
