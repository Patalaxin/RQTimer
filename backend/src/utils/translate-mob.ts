import { mobTranslations } from '../mob/mobs-translations';

/**
 * Минимум полей, нужных для перевода. Специально структурный тип, а не
 * конкретная модель: сюда прилетают и строки из Postgres, и lean-документы
 * Mongo из ещё не мигрировавших модулей.
 *
 * `_id` — идентификатор из справочника мобов, по нему же ключуются переводы.
 */
export interface TranslatableMob {
  _id: unknown;
  mobName: string;
  shortName: string;
  respawnText?: string;
  location: string;
  mobType: string;
}

export function translateMob(mob: TranslatableMob, lang?: string): any {
  if (lang !== 'ru') {
    const t = mobTranslations[String(mob._id)]?.[lang];
    return {
      ...mob,
      mobName: t?.mobName ?? mob.mobName,
      shortName: t?.shortName ?? mob.shortName,
      respawnText: t?.respawnText ?? mob.respawnText,
      location: t?.location ?? mob.location,
      mobType: t?.mobType ?? mob.mobType,
    };
  }
  return mob;
}
