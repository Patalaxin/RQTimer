import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Single place that turns thrown errors into HTTP responses. Existing
 * HttpException subclasses pass through untouched (status codes/messages the
 * frontend already relies on stay the same). Prisma errors get translated here
 * instead of being caught ad hoc with try/catch + error.code checks in services.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const httpException = this.toHttpException(exception);

    if (httpException.getStatus() >= 500) {
      this.logger.error(
        httpException.message,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response
      .status(httpException.getStatus())
      .json(httpException.getResponse());
  }

  private toHttpException(exception: unknown): HttpException {
    if (exception instanceof HttpException) {
      return exception;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaError(exception);
    }

    return new InternalServerErrorException('Unexpected error');
  }

  private fromPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): HttpException {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[] | undefined)?.join(
          ', ',
        );
        return new ConflictException(
          target ? `${target} already exists` : 'Resource already exists',
        );
      }
      case 'P2003':
        return new ConflictException('Related resource does not exist');
      case 'P2025':
        return new NotFoundException('Resource not found');
      default:
        return new InternalServerErrorException('Unexpected database error');
    }
  }
}
