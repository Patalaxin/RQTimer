import { mobTranslations } from '../mob/mobs-translations';
import { Mob } from '../schemas/mob.schema';

export function translateMob(mob: Mob, lang?: string): any {
  if (lang !== 'ru') {
    const t = mobTranslations[mob._id]?.[lang];
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
