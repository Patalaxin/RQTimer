import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  SECRET_CONSTANT: string;

  @IsString()
  @IsNotEmpty()
  UNIXTIME_KEY: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_USER: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  IP_DB: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  TELEGRAM_BOT_TOKEN: string;

  @IsString()
  @IsNotEmpty()
  RESEND_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  OTP_FROM: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_SERVER_URL: string;

  @IsString()
  @IsNotEmpty()
  PORT: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Config validation failed: ${errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('; ')}`,
    );
  }

  return validatedConfig;
}
