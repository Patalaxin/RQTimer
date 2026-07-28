import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Открывает ручку, закрытую guard'ом на уровне контроллера. Умолчание
 * «закрыто, открытое помечено явно» — забытый декоратор оставляет ручку
 * закрытой, а не публичной.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
