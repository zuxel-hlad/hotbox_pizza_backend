import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();
  const request = { method: 'GET', url: '/orders/1' };
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  const loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [new BadRequestException(['first', 'second']), HttpStatus.BAD_REQUEST, ['first', 'second']],
    [new NotFoundException('Order not found'), HttpStatus.NOT_FOUND, 'Order not found'],
    [new HttpException('Plain message', HttpStatus.I_AM_A_TEAPOT), HttpStatus.I_AM_A_TEAPOT, 'Plain message'],
    [new HttpException({ error: 'Error text' }, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST, 'Error text'],
    [new HttpException({ code: 1 }, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST, '{"code":1}'],
    [new Error('Boom'), HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error'],
  ])('formats %p', (exception, expectedStatus, message) => {
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(expectedStatus);
    const [body] = json.mock.calls[0] as [Record<string, unknown>];

    expect(body).toEqual({ statusCode: expectedStatus, timestamp: body.timestamp, path: request.url, message });
    expect(Date.parse(body.timestamp as string)).not.toBeNaN();
  });

  it('logs the failed request', () => {
    filter.catch(new NotFoundException('Order not found'), host);

    expect(loggerError).toHaveBeenCalledWith('[GET] /orders/1 → "Order not found"');
  });
});
