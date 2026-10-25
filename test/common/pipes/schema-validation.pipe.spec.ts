import { SchemaValidationPipe } from '@common/pipes/schema-validation.pipe';
import { phoneSchema } from '@common/schemas/phone.schema';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

describe('SchemaValidationPipe', () => {
  const pipe = new SchemaValidationPipe();
  const schema = z.strictObject({
    password: z.string().min(8, 'Password must be more than 8 characters long.'),
    username: z.string().min(1).max(5),
    code: z.string().min(4).optional(),
    count: z.number().int().min(1),
    price: z.number().positive().max(100),
    email: z.email().optional(),
    imgUrl: z.url().optional(),
    status: z.enum(['PENDING', 'DONE']).optional(),
    phone: phoneSchema.optional(),
    ids: z.array(z.number()).min(1).max(2),
    tags: z.array(z.string()).min(2).optional(),
    pizzas: z.array(z.strictObject({ pizzaId: z.number() })).optional(),
  });
  const valid = { password: 'password', username: 'john', count: 1, price: 10, ids: [1] };
  const validate = (value: unknown) => pipe.transform(value, { type: 'body', schema });
  const messagesOf = async (value: unknown): Promise<string[]> => {
    const error = await validate(value).catch((exception: BadRequestException) => exception);

    expect(error).toBeInstanceOf(BadRequestException);

    return (error as BadRequestException).getResponse()['message'] as string[];
  };

  it('passes a valid value through', async () => {
    await expect(validate(valid)).resolves.toEqual(valid);
  });

  it('reports every field of a missing body', async () => {
    const loginSchema = z.strictObject({ email: z.email(), password: z.string() });

    await expect(pipe.transform(undefined, { type: 'body', data: 'user', schema: loginSchema })).rejects.toMatchObject({
      response: { message: ['email should not be empty', 'password should not be empty'] },
    });
  });

  it('skips parameters without a schema', async () => {
    await expect(pipe.transform('raw', { type: 'body' })).resolves.toBe('raw');
  });

  it.each([
    ['a missing field', { ...valid, password: undefined }, 'password should not be empty'],
    ['a wrong type', { ...valid, password: 5 }, 'password must be a string'],
    ['a non-integer', { ...valid, count: 1.5 }, 'count must be an integer number'],
    ['a custom message', { ...valid, password: 'short' }, 'Password must be more than 8 characters long.'],
    ['an empty string', { ...valid, username: '' }, 'username should not be empty'],
    ['a short string', { ...valid, code: 'abc' }, 'code must be longer than or equal to 4 characters'],
    ['a long string', { ...valid, username: 'johnny' }, 'username must be shorter than or equal to 5 characters'],
    ['a small number', { ...valid, count: 0 }, 'count must not be less than 1'],
    ['a non-positive number', { ...valid, price: 0 }, 'price must be greater than 0'],
    ['a big number', { ...valid, price: 101 }, 'price must not be greater than 100'],
    ['an empty array', { ...valid, ids: [] }, 'ids should not be empty'],
    ['a short array', { ...valid, tags: ['a'] }, 'tags must contain at least 2 elements'],
    ['a long array', { ...valid, ids: [1, 2, 3] }, 'ids must contain no more than 2 elements'],
    ['an invalid email', { ...valid, email: 'john' }, 'email must be an email'],
    ['an invalid url', { ...valid, imgUrl: 'not-url' }, 'imgUrl must be a URL address'],
    ['an unknown enum value', { ...valid, status: 'NEW' }, 'status must be one of the following values: PENDING, DONE'],
    ['an invalid phone', { ...valid, phone: '0501234567' }, 'phone must be a valid phone number'],
    ['an unknown property', { ...valid, age: 1 }, 'property age should not exist'],
    ['a nested field', { ...valid, pizzas: [{ pizzaId: '1' }] }, 'pizzas.0.pizzaId must be a number'],
    [
      'a nested unknown property',
      { ...valid, pizzas: [{ pizzaId: 1, size: 1 }] },
      'property pizzas.0.size should not exist',
    ],
  ])('reports %s as a flat message', async (_, value, message) => {
    await expect(messagesOf(value)).resolves.toEqual([message]);
  });

  it('reports every invalid field', async () => {
    await expect(messagesOf({})).resolves.toEqual([
      'password should not be empty',
      'username should not be empty',
      'count should not be empty',
      'price should not be empty',
      'ids should not be empty',
    ]);
  });

  it('accepts international phone numbers', async () => {
    await expect(validate({ ...valid, phone: '+380501234567' })).resolves.toMatchObject({ phone: '+380501234567' });
    await expect(validate({ ...valid, phone: '+48501234567' })).resolves.toMatchObject({ phone: '+48501234567' });
  });
});
