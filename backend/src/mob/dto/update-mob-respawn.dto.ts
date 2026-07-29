import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Три способа задать одно и то же — момент следующего респауна. */
export enum RespawnInput {
  /** Сдвинуть текущий респаун на N кулдаунов вперёд. */
  cooldown = 'cooldown',
  /** Момент смерти: респаун = момент + cooldownTime моба. */
  dateOfDeath = 'dateOfDeath',
  /** Момент респауна напрямую. */
  dateOfRespawn = 'dateOfRespawn',
}

/**
 * Значение читается по-разному в зависимости от `by`, поэтому и проверяется
 * по-разному. Валидатор висит на `value` намеренно: @IsOptional() на поле
 * снимает с него вообще все проверки, когда значения нет, — а `value`
 * обязателен и потому годится в носители сквозной проверки.
 */
@ValidatorConstraint({ name: 'respawnValue', async: false })
export class RespawnValueConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments): boolean {
    const { by } = args.object as UpdateMobRespawnDtoRequest;

    if (by === RespawnInput.cooldown) {
      return Number.isInteger(value) && value > 0;
    }

    // Момент времени: unix-миллисекунды, до эпохи респаунов не бывает.
    return Number.isFinite(value) && value >= 0;
  }

  defaultMessage(args: ValidationArguments): string {
    const { by } = args.object as UpdateMobRespawnDtoRequest;

    return by === RespawnInput.cooldown
      ? 'value must be a positive integer number of cooldowns'
      : 'value must be a unix timestamp in milliseconds';
  }
}

/**
 * Раньше на это было три ручки с тремя почти одинаковыми DTO. Представление
 * теперь выбирается полем `by`, поэтому задать два способа сразу или не задать
 * ни одного попросту нечем — взаимоисключение держится на форме запроса, а не
 * на проверке post factum.
 */
export class UpdateMobRespawnDtoRequest {
  @ApiProperty({ enum: RespawnInput, description: 'Чем задано время респауна' })
  @IsEnum(RespawnInput)
  by: RespawnInput;

  @ApiProperty({
    description:
      'Для cooldown — число кулдаунов (целое > 0), иначе момент в unix-миллисекундах',
  })
  @IsNumber()
  @Validate(RespawnValueConstraint)
  value: number;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  comment?: string;
}
