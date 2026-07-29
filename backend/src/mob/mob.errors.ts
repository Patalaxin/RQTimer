import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../errors/app.error';

/** Моба нет в справочнике. */
export class MobNotFound extends NotFoundError {
  constructor(message = 'Mob not found') {
    super('MOB_NOT_FOUND', message);
  }
}

/**
 * Моб есть в справочнике, но не добавлен в таймер этой группы — либо нет
 * самой строки mobs_data. Раньше отвечало 400, хотя речь именно об
 * отсутствующем объекте.
 */
export class MobNotFoundInGroup extends NotFoundError {
  constructor() {
    super('MOB_NOT_FOUND_IN_GROUP', 'Mob or Mob data not found for this group');
  }
}

/** Строки mobs_data нет. */
export class MobDataNotFound extends NotFoundError {
  constructor() {
    super('MOB_DATA_NOT_FOUND', 'Mob data not found');
  }
}

/**
 * Настройки группы запрещают рядовым участникам добавлять мобов. Это про
 * права, поэтому 403, — раньше здесь отвечало 404.
 */
export class MobsAddForbidden extends ForbiddenError {
  constructor() {
    super(
      'MOBS_ADD_FORBIDDEN',
      'In this group, default members cannot add mobs',
    );
  }
}

/**
 * Сдвиг на кулдауны считается от текущего респауна, а его нет: моб ещё ни разу
 * не отмечен либо респаун потерян. Сначала нужно задать время смерти или
 * респауна.
 */
export class RespawnTimeMissing extends ValidationError {
  constructor() {
    super(
      'RESPAWN_TIME_MISSING',
      'Respawn time is missing. Specify either date of death or date of respawn.',
    );
  }
}

/** В теле запроса пришли идентификаторы, которых нет в справочнике. */
export class UnknownMobsRequested extends ValidationError {
  constructor() {
    super('UNKNOWN_MOBS_REQUESTED', 'One or more mobs not found');
  }
}
