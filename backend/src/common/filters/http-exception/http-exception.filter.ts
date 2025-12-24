import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ErrorResponse {
  success: false;
  errorId: string;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  details?: any;
  statusCode: number;
}

@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const errorId = uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: string | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = this.getErrorNameFromStatus(status);
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || 'An error occurred';
        error = responseObj.error || this.getErrorNameFromStatus(status);
        details = responseObj.details || null;
      }
    } else if (exception instanceof Error && exception.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      error = 'Bad Request';
      details = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
      error = exception.name || 'Internal Server Error';
      details = process.env.NODE_ENV === 'development' ? (exception.stack ?? null) : null;
    }

    this.logError(request, exception, errorId, status);

    const errorResponse: ErrorResponse = {
      success: false,
      errorId,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      statusCode: status,
    };

    if (details && (process.env.NODE_ENV === 'development' || status >= 500)) {
      errorResponse.details = details;
    }

    response.status(status).json(errorResponse);
  }

  private logError(request: Request, exception: unknown, errorId: string, status: number) {
    const logContext = {
      errorId,
      method: request.method,
      url: request.url,
      statusCode: status,
      userId: (request as any).user?.id,
      userAgent: request.headers['user-agent'],
      ip: request.ip || request.headers['x-forwarded-for'] || request.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        `${errorId} - ${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : exception,
        JSON.stringify(logContext),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${errorId} - ${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.message : 'Client error',
        JSON.stringify(logContext),
      );
    } else {
      this.logger.log(
        `${errorId} - ${request.method} ${request.url} - ${status}`,
        JSON.stringify(logContext),
      );
    }

    if (exception instanceof Error && exception.name === 'ValidationError') {
      this.logger.debug(`Validation error details: ${exception.message}`);
    }
  }

  private getErrorNameFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.METHOD_NOT_ALLOWED:
        return 'Method Not Allowed';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  }
}
