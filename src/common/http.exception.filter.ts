import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const responseObj = res as Record<string, unknown>;

        if (Array.isArray(responseObj['message'])) {
          message = responseObj['message'] as string[];
        } else if (typeof responseObj['message'] === 'string') {
          message = responseObj['message'];
        } else if (typeof responseObj['error'] === 'string') {
          message = responseObj['error'];
        } else {
          message = JSON.stringify(responseObj);
        }
      } else {
        message = res as string;
      }
    }

    this.logger.error(`[${request.method}] ${request.url} → ${JSON.stringify(message)}`);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
