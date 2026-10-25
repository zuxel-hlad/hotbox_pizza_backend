import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { SchemaValidationPipe } from '@common/pipes/schema-validation.pipe';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new SchemaValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('HotBox Pizza API')
    .setDescription('The best pizza API')
    .setVersion('1.0')
    .addSecurity('Token', {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Please enter the token in the format: Token <jwt>',
    })
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));

  await app.listen(3000);
};
void bootstrap();
