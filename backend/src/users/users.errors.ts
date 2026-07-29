import { ConflictError, NotFoundError } from '../errors/app.error';

/**
 * Занятые email или nickname — конфликт с текущим состоянием, а не плохо
 * составленный запрос. Бросается из двух мест (предпроверка и гонка на
 * уникальном индексе), поэтому живёт отдельным классом.
 */
export class UserAlreadyExists extends ConflictError {
  constructor() {
    super(
      'USER_ALREADY_EXISTS',
      'A user with this email or nickname already exists!',
    );
  }
}

/** Текст параметром: в разных ручках он исторически разный. */
export class UserNotFound extends NotFoundError {
  constructor(message = 'User not found!') {
    super('USER_NOT_FOUND', message);
  }
}
