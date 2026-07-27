import { Prisma } from '@prisma/client';
import { AppError } from './app.error';

/** Коды Prisma, которые вообще имеет смысл перехватывать в сервисе. */
type PrismaErrorCode = 'P2002' | 'P2003' | 'P2025';

type Handlers = Partial<
  Record<
    PrismaErrorCode,
    (error: Prisma.PrismaClientKnownRequestError) => AppError
  >
>;

/**
 * Переводит ошибку Prisma в доменную — но только там, где нужен свой текст
 * вместо дефолтного из AllExceptionsFilter.
 *
 *   } catch (error) {
 *     throw mapPrismaError(error, { P2025: () => new NotFoundError('MOB_NOT_FOUND', 'Моба нет') });
 *   }
 *
 * Всё неперечисленное возвращается как есть и достаётся фильтру нетронутым —
 * поэтому хелпер никогда не проглатывает причину и не требует ветки `throw error`
 * в конце каждого catch.
 */
export function mapPrismaError(error: unknown, handlers: Handlers): unknown {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return error;
  }

  const handler = handlers[error.code as PrismaErrorCode];

  return handler ? handler(error) : error;
}
