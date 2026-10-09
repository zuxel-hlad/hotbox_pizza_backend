import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ACCESS_TOKEN_SECRET } from '@core/config/jwt.config';
import { MailService } from '@modules/mail/mail.service';
import { UserEntity } from '@modules/user/user.entity';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { sign } from 'jsonwebtoken';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

export interface TestApp {
  app: INestApplication<App>;
  mailService: { sendMail: jest.Mock };
  repository: (entity: new () => object) => RepositoryMock;
  resetMocks: () => void;
}

export const createTestApp = async (): Promise<TestApp> => {
  const repositories = new Map<new () => object, RepositoryMock>();
  const repository = (entity: new () => object): RepositoryMock => {
    if (!repositories.has(entity)) {
      repositories.set(entity, createRepositoryMock());
    }

    return repositories.get(entity);
  };
  const mailService = { sendMail: jest.fn() };
  const resetMocks = () => {
    mailService.sendMail.mockReset();

    for (const repositoryMock of repositories.values()) {
      Object.assign(repositoryMock, createRepositoryMock());
    }
  };

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DataSource)
    .useValue({ isInitialized: false, entityMetadatas: [], options: { type: 'postgres' }, getRepository: repository })
    .overrideProvider(MailService)
    .useValue(mailService)
    .compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>({ logger: false });
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  return { app, mailService, repository, resetMocks };
};

export const createAuthHeader = ({ id, email, username, tokenVersion }: Partial<UserEntity>): string =>
  `Token ${sign({ id, email, username, tokenVersion }, ACCESS_TOKEN_SECRET)}`;
