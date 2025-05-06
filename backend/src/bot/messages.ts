import { BotSession } from '../schemas/telegram-bot.schema';

export const MESSAGES = {
  CHOOSE_SERVER: 'Выберите сервер:',
  ENTER_EMAIL_PASSWORD:
    'Теперь введите свою почту и пароль (пример: user@example.com 12345):',
  INVALID_FORMAT: 'Некорректный формат. Введите почту и пароль через пробел.',
  AUTH_ERROR: 'Ошибка авторизации. Попробуйте снова.',
  SUCCESS_CONNECT: (server: string) =>
    `Вы успешно подключены к серверу ${server}!`,
  NOT_CONNECTED: 'Вы не подключены к серверу.',
  PAUSED: '⏸ Уведомления приостановлены.',
  RESUMED: '▶ Уведомления возобновлены.',
  PAUSE: '⏸ Остановить уведомления',
  RESUME: '▶ Возобновить уведомления',
  SWITCH_SERVER: '🚪 Поменять сервер',
  LEAVE_SERVER: '🚪 Ты покинул сервер. Выбери новый сервер для отслеживания:',
  WRONG_SERVER: 'Неверный выбор сервера.',
  SELECT_SERVER: 'Сначала выберите сервер!',
  NEW_INFO: (session: BotSession, response: string) =>
    `Новая информация для сервера ${session.server}:
${response}`,
};
