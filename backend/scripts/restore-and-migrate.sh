#!/usr/bin/env bash
# Восстанавливает mongodump-бэкап (tar.gz) в локальный докеровский Mongo и
# прогоняет все migrate-*-to-postgres.ts скрипты в порядке, требуемом их
# внешними ключами (users -> groups -> mobs -> mobs_data -> history ->
# notifications -> bot-sessions).
#
# Использование:
#   ./scripts/restore-and-migrate.sh /path/to/mongo_backup_YYYYMMDD_HHMMSS.tar.gz
#
# Требования:
#   - docker compose уже поднят (mongo и postgres живые: docker compose up -d)
#   - в .env заданы DATABASE_USER/DATABASE_PASSWORD/IP_DB (для Mongo) и DATABASE_URL (для Postgres)
#   - mongorestore установлен локально (brew install mongodb-database-tools)
#   - npx prisma migrate deploy уже применил схему к Postgres

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 /path/to/mongo_backup_*.tar.gz" >&2
  exit 1
fi

BACKUP_TAR="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$BACKUP_TAR" ]; then
  echo "Файл не найден: $BACKUP_TAR" >&2
  exit 1
fi

cd "$BACKEND_DIR"

if [ ! -f .env ]; then
  echo ".env не найден в $BACKEND_DIR" >&2
  exit 1
fi

# .env не гарантированно валиден как shell-скрипт (например, значения с
# пробелами вроде app-пароля в OTP_PASS), поэтому не source'им файл целиком —
# вытаскиваем только нужные ключи как есть, без интерпретации.
env_var() {
  grep -m1 "^${1}=" .env | cut -d= -f2-
}

DATABASE_USER="$(env_var DATABASE_USER)"
DATABASE_PASSWORD="$(env_var DATABASE_PASSWORD)"
IP_DB="$(env_var IP_DB)"
IP_DB="${IP_DB:-localhost}"

: "${DATABASE_USER:?DATABASE_USER не задан в .env}"
: "${DATABASE_PASSWORD:?DATABASE_PASSWORD не задан в .env}"

MONGO_URI="mongodb://${DATABASE_USER}:${DATABASE_PASSWORD}@${IP_DB}:27017/admin?authSource=admin"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

echo "==> Распаковка бэкапа во временную папку"
tar -xzf "$BACKUP_TAR" -C "$WORK_DIR"

# Внутри архива один каталог верхнего уровня вида mongo_backup_<дата>/admin
DUMP_ADMIN_DIR="$(find "$WORK_DIR" -maxdepth 2 -type d -name admin | head -n1)"
if [ -z "$DUMP_ADMIN_DIR" ]; then
  echo "Не нашёл каталог admin/ внутри архива — структура бэкапа не такая, как ожидалось" >&2
  exit 1
fi

echo "==> Восстановление в локальный Mongo (docker), база admin"
mongorestore --uri="$MONGO_URI" --drop --db=admin "$DUMP_ADMIN_DIR"

echo "==> Проверка, что Postgres-схема применена (prisma migrate deploy)"
npx prisma migrate deploy

run_migration() {
  local script="$1"
  echo "==> Миграция: $script"
  MONGO_URI="$MONGO_URI" npx ts-node "src/scripts/${script}.ts"
}

run_migration migrate-users-tokens-to-postgres
run_migration migrate-groups-to-postgres
run_migration migrate-mobs-to-postgres
run_migration migrate-mobs-data-to-postgres
run_migration migrate-history-to-postgres
run_migration migrate-notifications-to-postgres
run_migration migrate-bot-sessions-to-postgres

echo "==> Готово. Проверить количество строк:"
echo '    docker exec backend-postgres-1 psql -U "$POSTGRES_USER" -d rqtimer -c "select (select count(*) from users) users, (select count(*) from groups) groups, (select count(*) from mobs) mobs, (select count(*) from mobs_data) mobs_data, (select count(*) from history) history;"'
