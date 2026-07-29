import { Request } from 'express';

/**
 * Достаёт JWT из заголовка Authorization. Схема кроме Bearer считается
 * отсутствием токена — иначе guard пропустил бы, например, Basic-заголовок.
 */
export function extractTokenFromHeader(request: Request): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}
