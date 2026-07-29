<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Миграция с MongoDB на PostgreSQL

Приложение полностью работает через Prisma и к Mongo не подключается. Mongo и
схемы в `src/schemas/*.schema.ts` остаются только ради одноразовых скриптов
переноса данных.

### Схема применяется так

```bash
npx prisma migrate deploy
```

Миграции лежат в `prisma/migrations`. Файлы SQL сгенерированы
`prisma migrate diff`, поэтому применять их можно и без доступа к дев-базе.

### Перенос данных

Порядок важен: `mobs_data` ссылается на справочник мобов внешним ключом,
`refresh_tokens` — на пользователей, а группы сверяются с `users.groupName`.

```bash
MONGO_URI=mongodb://user:pass@host:27017/admin npx ts-node src/scripts/migrate-users-tokens-to-postgres.ts
MONGO_URI=... npx ts-node src/scripts/migrate-mobs-to-postgres.ts
MONGO_URI=... npx ts-node src/scripts/migrate-groups-to-postgres.ts
MONGO_URI=... npx ts-node src/scripts/migrate-mobs-data-to-postgres.ts
MONGO_URI=... npx ts-node src/scripts/migrate-history-to-postgres.ts
MONGO_URI=... npx ts-node src/scripts/migrate-bot-sessions-to-postgres.ts
MONGO_URI=... npx ts-node src/scripts/migrate-notifications-to-postgres.ts
```

Каждый скрипт только читает Mongo, печатает сверку по количеству строк и
отдельно сообщает о том, что перенести не удалось: мобы без записи в
справочнике, дубликаты почт в сессиях бота, пользователи, ссылающиеся на
несуществующую группу. Историю и уведомления скрипты переносят без записей,
у которых уже истёк TTL.

Когда перенос завершён и проверен, из проекта можно убрать `mongoose`,
`@nestjs/mongoose`, `src/schemas/*.schema.ts`, `src/scripts/migrate-*.ts`,
переменные `DATABASE_USER` / `DATABASE_PASSWORD` / `IP_DB` и сервисы `mongo`
и `mongo-express` из `docker-compose.yml`.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest! is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
