import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

/**
 * Подмена ConfigService для тестов.
 *
 * На незаданный ключ падает, а не отдаёт undefined: если тест забыл про
 * переменную, это должно быть видно сразу, а не всплыть где-то ниже строкой
 * `undefined` в URL или пустым секретом.
 */
export function configProvider(values: Partial<EnvironmentVariables>) {
  return {
    provide: ConfigService,
    useValue: {
      get(key: keyof EnvironmentVariables) {
        if (!(key in values)) {
          throw new Error(`Тест не задал переменную окружения ${key}`);
        }
        return values[key];
      },
    },
  };
}
