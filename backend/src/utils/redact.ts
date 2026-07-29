/**
 * Секреты, которые ходят в query-строке внешних API (ключ timezonedb уезжает
 * в лог вместе с URL при каждой неудачной синхронизации времени).
 */
const SECRET_QUERY_PARAM =
  /([?&](?:key|token|secret|password|api[_-]?key)=)[^&\s"'`]+/gi;

/** Заголовок Authorization в дампах запросов. */
const AUTH_HEADER = /(authorization['"\s:]+)(?:bearer\s+)?[\w.\-+/=]+/gi;

/**
 * Глушит секреты в тексте перед записью в лог. Стектрейсы и дампы ошибок HTTP
 * тянут за собой полный URL запроса вместе с ключом — писать это в лог нельзя.
 */
export function redactSecrets(value: string): string;
export function redactSecrets(value: undefined): undefined;
export function redactSecrets(value: string | undefined): string | undefined;
export function redactSecrets(value: string | undefined): string | undefined {
  return value
    ?.replace(SECRET_QUERY_PARAM, '$1<redacted>')
    .replace(AUTH_HEADER, '$1<redacted>');
}
