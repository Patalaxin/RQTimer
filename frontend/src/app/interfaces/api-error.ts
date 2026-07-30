/**
 * Тело ошибки, которое отдаёт бэк — единый формат для всех ручек
 * (backend/src/filters/all-exceptions.filter.ts).
 *
 * Ветвиться нужно по `code`: он стабилен и переживает переформулировку
 * текста. `message` — человекочитаемый, годится только чтобы показать как
 * есть; сравнивать с ним строки нельзя, на этом уже дважды погорели.
 *
 * `message` бывает массивом: так ValidationPipe отдаёт список нарушенных
 * правил.
 */
export interface IApiError {
  statusCode: number;
  code: string;
  message: string | string[];
}
