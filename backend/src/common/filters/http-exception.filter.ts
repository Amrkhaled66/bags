import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttpException ? exception.getResponse() : null;
    const objectPayload =
      payload !== null && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : null;
    const rawMessage = objectPayload?.message ?? payload;
    const message =
      status >= 500
        ? 'Internal server error'
        : Array.isArray(rawMessage)
          ? 'Request validation failed'
          : typeof rawMessage === 'string'
            ? rawMessage
            : (HttpStatus[status] ?? 'Request failed');
    const requestId = String(
      response.getHeader('X-Request-Id') ??
        request.headers['x-request-id'] ??
        '',
    );

    if (!isHttpException || status >= 500) {
      const error =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `[${requestId}] ${request.method} ${request.originalUrl}`,
        error,
      );
    }

    response.status(status).json({
      statusCode: status,
      code:
        status === 500 ? 'INTERNAL_SERVER_ERROR' : this.statusCodeName(status),
      message,
      details:
        status < 500
          ? Array.isArray(rawMessage)
            ? rawMessage
            : (objectPayload?.errors ?? null)
          : null,
      path: request.originalUrl,
      method: request.method,
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  private statusCodeName(status: number) {
    const name = HttpStatus[status];
    return typeof name === 'string' ? name : 'HTTP_ERROR';
  }
}
