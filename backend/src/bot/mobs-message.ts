import { DateTime } from 'luxon';
import { GetFullMobWithUnixDtoResponse } from '../mob/dto/get-mob.dto';
import { Locations, MobName, Servers } from '../schemas/mobs.enum';

/**
 * Убирает из готового сообщения строки мобов, которые пользователь отписал.
 * Фильтруем текст, а не исходные данные, чтобы общее сообщение считалось один
 * раз на всех подписчиков.
 */
export function filterMobsForUser(
  fullMessage: string,
  excludedMobs: string[],
): string {
  return fullMessage
    .split('\n')
    .filter((line) => {
      const [mobName] = line.split(' - ');

      return !excludedMobs.includes(mobName);
    })
    .map((line) => {
      return line;
    })
    .join('\n');
}

/**
 * Собирает сообщение о респаунах: группировка по датам в часовом поясе
 * пользователя, внутри даты — по времени, обновлённый моб помечается.
 */
export function transformFindAllMobsResponse(
  mobsInfo: GetFullMobWithUnixDtoResponse[],
  updatedMobName: MobName,
  updatedMobLocation: Locations,
  timezone: string,
  server: Servers,
): string {
  const groupedByDate: Record<string, { time: number; line: string }[]> = {};

  for (const mobData of mobsInfo) {
    const respawnTime = mobData.mobData.respawnTime;
    if (!respawnTime) continue;

    const dateTime = DateTime.fromMillis(respawnTime).setZone(timezone);
    const date = dateTime.toFormat('dd.MM.yyyy');
    const time = dateTime.toFormat('HH:mm:ss');

    const isUpdated =
      mobData.mob.mobName === updatedMobName &&
      mobData.mob.location === updatedMobLocation;
    const updatedTag = isUpdated ? ' 🔄' : '';

    const { mobName, location, mobType } = mobData.mob;

    const line =
      mobType === 'Босс'
        ? `${mobName} - ${time}${updatedTag}`
        : `${mobName} - ${location} - ${time}${updatedTag}`;

    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }

    groupedByDate[date].push({ time: dateTime.toMillis(), line });
  }

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) =>
      DateTime.fromFormat(a, 'dd.MM.yyyy').toMillis() -
      DateTime.fromFormat(b, 'dd.MM.yyyy').toMillis(),
  );

  let message = `Сервер: ${server} \nПо часовому поясу "${timezone}" респаун будет в:\n`;

  for (const date of sortedDates) {
    message += `\n${date}:\n`;
    const lines = groupedByDate[date]
      .sort((a, b) => a.time - b.time)
      .map((entry) => entry.line);

    for (const line of lines) {
      message += `${line}\n`;
    }
  }

  return message.trim();
}
