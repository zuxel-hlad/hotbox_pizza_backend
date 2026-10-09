export const createQueryBuilderMock = <T>(entities: T[] = [], count = entities.length) => {
  const builder = {
    where: jest.fn(),
    orWhere: jest.fn(),
    andWhere: jest.fn(),
    clone: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    orderBy: jest.fn(),
    getCount: jest.fn().mockResolvedValue(count),
    getMany: jest.fn().mockResolvedValue(entities),
  };

  for (const method of ['where', 'orWhere', 'andWhere', 'clone', 'skip', 'take', 'orderBy'] as const) {
    builder[method].mockReturnValue(builder);
  }

  return builder;
};

export type QueryBuilderMock = ReturnType<typeof createQueryBuilderMock>;
