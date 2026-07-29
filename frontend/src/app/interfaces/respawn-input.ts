/**
 * Чем задано время респауна в PUT /mobs/:server/:mobId/respawn — поле `by`
 * в теле запроса (backend/src/mob/dto/update-mob-respawn.dto.ts).
 *
 * Значения должны совпадать с бэковым enum: он проверяет `by` по списку и
 * отвечает 400 на всё остальное.
 */
export enum RespawnInput {
  /** Сдвинуть текущий респаун на N кулдаунов вперёд. */
  cooldown = 'cooldown',
  /** Момент смерти: респаун = момент + cooldownTime моба. */
  dateOfDeath = 'dateOfDeath',
  /** Момент респауна напрямую. */
  dateOfRespawn = 'dateOfRespawn',
}
