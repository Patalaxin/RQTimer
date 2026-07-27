import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, ConflictError, NotFoundError } from '../errors/app.error';
import { redactSecrets } from '../utils/redact';

/**
 * Единый формат тела ошибки.
 *
 * `code` — то, на что фронту стоит завязываться: он не меняется при
 * переформулировке текста. `message` остаётся человекочитаемым, потому что
 * интерцептор фронта показывает его пользователю как есть; на `code` он может
 * переезжать постепенно, экран за экраном.
 *
 * `message` бывает массивом: так ValidationPipe отдаёт список нарушенных
 * правил, и ломать это не нужно.
 */
export interface ErrorBody {
  statusCode: number;
  code: string;
  message: string | string[];
}

const CODE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

/**
 * Единственное место, где ошибка становится HTTP-ответом.
 *
 * Доменные ошибки (AppError) приносят свой код и статус. Ошибки Prisma
 * переводятся здесь, а не try/catch'ами по сервисам: локальный catch нужен
 * только ради доменного текста и делается через mapPrismaError. Всё
 * неопознанное отвечает ровным 500 без подробностей наружу — причина уходит в
 * лог, а не пользователю.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // В лог — настоящая причина (в ответе её нет), но без секретов.
      const cause =
        exception instanceof Error ? exception.message : String(exception);
      this.logger.error(
        redactSecrets(`${body.statusCode} ${body.code}: ${cause}`),
        redactSecrets(exception instanceof Error ? exception.stack : undefined),
      );
    }

    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof AppError) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.toBody(this.fromPrismaError(exception));
    }

    // Всё, что бросает сам Nest: ValidationPipe, гарды, ручные HttpException.
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      return {
        statusCode,
        code: CODE_BY_STATUS[statusCode] ?? `HTTP_${statusCode}`,
        message: this.messageOf(exception),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error',
    };
  }

  private messageOf(exception: HttpException): string | string[] {
    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return payload;
    }

    const { message } = payload as { message?: unknown };
    if (typeof message === 'string' || Array.isArray(message)) {
      return message as string | string[];
    }

    return exception.message;
  }

  private fromPrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): AppError {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[] | undefined)?.join(', ');
        return new ConflictError(
          'UNIQUE_VIOLATION',
          target ? `${target} already exists` : 'Resource already exists',
        );
      }
      case 'P2003':
        return new ConflictError(
          'FOREIGN_KEY_VIOLATION',
          'Related resource does not exist',
        );
      case 'P2025':
        return new NotFoundError('NOT_FOUND', 'Resource not found');
      default:
        return new AppError(
          'DATABASE_ERROR',
          'Unexpected database error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }
}
