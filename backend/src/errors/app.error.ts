import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Базовый класс доменных ошибок приложения.
 *
 * Сервис бросает ошибку по смыслу («моба нет», «нет прав»), а не по HTTP-коду.
 * Код ответа задаётся один раз — категорией ошибки (классы ниже), поэтому
 * выбрать его наугад нельзя: чтобы ответить 404, надо назвать ситуацию
 * «не найдено».
 *
 * `code` — стабильный машиночитаемый идентификатор для фронта. Он переживает
 * переформулировку текста, в отличие от `message`, по которому фронт сейчас
 * сравнивает строки (и уже дважды промахнулся).
 *
 * Наследование от HttpException осознанное: Nest тогда обрабатывает доменные
 * ошибки штатно, а глобальный фильтр остаётся тонким — он только рендерит.
 */
export class AppError extends HttpException {
  constructor(
    readonly code: string,
    message: string,
    status: HttpStatus,
  ) {
    super(message, status);
  }
}

/** 400 — клиент прислал то, что не проходит по смыслу задачи. */
export class ValidationError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, HttpStatus.BAD_REQUEST);
  }
}

/** 401 — не аутентифицирован: нет токена, протух, пароль не подошёл. */
export class UnauthorizedError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, HttpStatus.UNAUTHORIZED);
  }
}

/** 403 — кто ты, знаем; делать это тебе нельзя. */
export class ForbiddenError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, HttpStatus.FORBIDDEN);
  }
}

/** 404 — запрошенного объекта нет. */
export class NotFoundError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, HttpStatus.NOT_FOUND);
  }
}

/** 409 — состояние не позволяет: занято, уже существует, уже в группе. */
export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, HttpStatus.CONFLICT);
  }
}

/**
 * 502 — лёг внешний сервис (Resend, timezonedb). Виноват не клиент, поэтому
 * не 400: по коду видно, что повтор запроса имеет смысл.
 */
export class UpstreamError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, HttpStatus.BAD_GATEWAY);
  }
}
