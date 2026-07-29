import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf, TelegramError } from 'telegraf';

const FIRST_RETRY_MS = 5_000;
const MAX_RETRY_MS = 5 * 60_000;

/**
 * Владеет жизненным циклом подключения к Telegram и держит его в стороне от
 * жизненного цикла приложения.
 *
 * nestjs-telegraf по умолчанию сам дёргает `bot.launch()` в фабрике провайдера —
 * без await и без catch. `launch()` внутри ждёт `getMe()`, поэтому недоступный
 * Telegram на старте превращался в unhandled rejection и ронял процесс. То же
 * самое на ходу: промис `launch()` реджектится, когда цикл long polling умирает
 * (401/409 или любая не-сетевая ошибка), и приложение падало вместе с ботом.
 *
 * Поэтому автозапуск выключен (`launchOptions: false` в TelegramBotModule), а
 * подключением занимается этот сервис: запускает бота в фоне, переживает
 * недоступность Telegram и сам переподключается.
 */
@Injectable()
export class TelegramConnectionService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(TelegramConnectionService.name);
  private connected = false;
  private shuttingDown = false;
  private retryDelayMs = FIRST_RETRY_MS;
  private retryTimer?: NodeJS.Timeout;
  private wakeUp?: () => void;

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly config: ConfigService,
  ) {}

  /** Готов ли бот принимать исходящие сообщения прямо сейчас. */
  get isAvailable(): boolean {
    return this.connected;
  }

  onApplicationBootstrap(): void {
    if (!this.config.get<string>('TELEGRAM_BOT_TOKEN')) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN не задан — бот отключён, приложение работает без уведомлений в Telegram',
      );
      return;
    }

    // Намеренно не ждём: старт приложения не должен зависеть от доступности
    // Telegram. Промис живёт всё время работы процесса и сам себя не реджектит.
    void this.connectionLoop();
  }

  async onApplicationShutdown(): Promise<void> {
    this.shuttingDown = true;
    this.cancelRetry();
    if (this.connected) {
      this.connected = false;
      // stop() бросается, если polling уже умер сам, — гасить нечего.
      try {
        this.bot.stop();
      } catch {
        // no-op
      }
    }
  }

  private async connectionLoop(): Promise<void> {
    while (!this.shuttingDown) {
      try {
        // launch() резолвится только когда polling остановлен, и реджектится,
        // когда он умер, — то есть одного await хватает и на старт, и на
        // отслеживание обрыва уже работающего подключения.
        await this.bot.launch({}, () => this.onConnected());
        if (this.shuttingDown) {
          return;
        }
        this.logger.warn('Long polling остановлен, переподключаемся');
      } catch (error) {
        if (this.isFatal(error)) {
          this.connected = false;
          this.logger.error(
            `Telegram отклонил токен (${(error as TelegramError).description}) — бот отключён до перезапуска с корректным TELEGRAM_BOT_TOKEN`,
          );
          return;
        }
        this.logger.warn(
          `Не удалось подключиться к Telegram: ${this.describe(error)}`,
        );
      }

      this.connected = false;
      await this.waitBeforeRetry();
    }
  }

  private onConnected(): void {
    this.connected = true;
    this.retryDelayMs = FIRST_RETRY_MS;
    this.logger.log('Подключение к Telegram установлено');
  }

  /**
   * 401 — токен неверный или отозван; повторять бессмысленно, нужен новый
   * конфиг. Всё остальное (сеть, 429, 5xx, 409 от параллельного инстанса)
   * лечится ожиданием.
   */
  private isFatal(error: unknown): boolean {
    return error instanceof TelegramError && error.code === 401;
  }

  private async waitBeforeRetry(): Promise<void> {
    const delay = this.retryDelayMs;
    this.retryDelayMs = Math.min(delay * 2, MAX_RETRY_MS);
    this.logger.log(`Следующая попытка через ${Math.round(delay / 1000)} с`);

    await new Promise<void>((resolve) => {
      this.wakeUp = resolve;
      this.retryTimer = setTimeout(resolve, delay);
    });
    this.retryTimer = undefined;
    this.wakeUp = undefined;
  }

  /** Будит цикл досрочно, чтобы shutdown не ждал полного таймаута backoff. */
  private cancelRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.wakeUp?.();
  }

  private describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
