import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  RespawnInput,
  UpdateMobRespawnDtoRequest,
} from './update-mob-respawn.dto';

/** Имена полей, на которых валидатор споткнулся. */
const errorsOf = (body: unknown): string[] =>
  validateSync(plainToInstance(UpdateMobRespawnDtoRequest, body))
    .map((error) => error.property)
    .sort();

describe('UpdateMobRespawnDtoRequest', () => {
  it.each([
    ['сдвиг на кулдауны', { by: RespawnInput.cooldown, value: 2 }],
    [
      'момент смерти',
      { by: RespawnInput.dateOfDeath, value: 1_800_000_000_000 },
    ],
    [
      'момент респауна',
      { by: RespawnInput.dateOfRespawn, value: 1_800_000_000_000 },
    ],
    [
      'момент респауна с комментарием',
      {
        by: RespawnInput.dateOfRespawn,
        value: 1_800_000_000_000,
        comment: 'ушёл в ребут',
      },
    ],
  ])('принимает %s', (_name, body) => {
    expect(errorsOf(body)).toEqual([]);
  });

  it('требует указать представление', () => {
    expect(errorsOf({ value: 1_800_000_000_000 })).toEqual(['by']);
  });

  it('не принимает представление вне списка', () => {
    expect(errorsOf({ by: 'whenever', value: 1 })).toEqual(['by']);
  });

  it('требует значение', () => {
    expect(errorsOf({ by: RespawnInput.dateOfDeath })).toEqual(['value']);
  });

  // Кулдаун — счётчик, а не момент времени: дробный или нулевой сдвиг
  // молча сломал бы расчёт респауна.
  it.each([
    ['ноль кулдаунов', 0],
    ['отрицательное число кулдаунов', -1],
    ['дробное число кулдаунов', 1.5],
  ])('не принимает %s', (_name, value) => {
    expect(errorsOf({ by: RespawnInput.cooldown, value })).toEqual(['value']);
  });

  it('принимает дробный момент времени', () => {
    expect(
      errorsOf({ by: RespawnInput.dateOfDeath, value: 1_800_000_000_000.5 }),
    ).toEqual([]);
  });

  it('не принимает момент времени до эпохи', () => {
    expect(errorsOf({ by: RespawnInput.dateOfDeath, value: -1 })).toEqual([
      'value',
    ]);
  });

  it('ограничивает длину комментария', () => {
    expect(
      errorsOf({
        by: RespawnInput.cooldown,
        value: 1,
        comment: 'я'.repeat(51),
      }),
    ).toEqual(['comment']);
  });
});
