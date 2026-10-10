export const createTransactionManagerMock = () => {
  const relation = { add: jest.fn(), remove: jest.fn() };

  return {
    exists: jest.fn(),
    existsBy: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(<T>(entity: T) => Promise.resolve(entity)),
    createQueryBuilder: jest.fn(() => ({ relation: () => ({ of: () => relation }) })),
    relation,
  };
};

export type TransactionManagerMock = ReturnType<typeof createTransactionManagerMock>;
