export const createRepositoryMock = () => ({
  find: jest.fn(),
  findBy: jest.fn(),
  findOne: jest.fn(),
  existsBy: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(<T>(entity: T) => Promise.resolve(entity)),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

export type RepositoryMock = ReturnType<typeof createRepositoryMock>;
