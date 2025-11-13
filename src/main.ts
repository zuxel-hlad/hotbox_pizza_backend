if (!process.env.IS_TS_NODE) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('module-alias/register');
}

import { AppModule } from '@app/app/app.module';
import { HttpExceptionFilter } from '@app/common/http.exception.filter';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('HotBox Pizza API')
    .setDescription('The best pizza API')
    .setVersion('1.0')
    .addTag('hotbox_pizza')
    .addSecurity('Token', {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Please enter the token in the format: Token <jwt>',
    })
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(3000);
};
bootstrap();
