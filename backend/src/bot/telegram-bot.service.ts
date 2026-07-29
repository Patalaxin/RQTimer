import { Logger } from '@nestjs/common';
import { Action, Ctx, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Context, Markup, Telegraf, TelegramError } from 'telegraf';
import { BotSession, Server } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Locations, MobName, Servers } from '../schemas/mobs.enum';
import { MobService } from '../mob/mob.service';
import {
  filterMobsForUser,
  transformFindAllMobsResponse,
} from './mobs-message';
import { MESSAGES } from './messages';
import { GetFullMobWithUnixDtoResponse } from '../mob/dto/get-mob.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramConnectionService } from './telegram-connection.service';

/** Всё, что нужно главному меню — чтобы не собирать ради него полную сессию. */
type MenuState = Pick<BotSession, 'server' | 'paused'>;

@Update()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  tempUserServers: Map<number, string> = new Map<number, string>();

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly connection: TelegramConnectionService,
    private readonly prisma: PrismaService,
    private readonly mobService: MobService,
  ) {}

  @Start()
  async handleStart(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from.id;
    const session = await this.prisma.botSession.findUnique({
      where: { userId },
    });

    if (!session || !session.isVerified) {
      await this.sendServerSelection(ctx);
    } else {
      await this.sendMainMenu(ctx, session);
    }
  }

  private async sendServerSelection(ctx: Context): Promise<void> {
    await ctx.reply(
      MESSAGES.CHOOSE_SERVER,
      Markup.inlineKeyboard(
        Object.values(Servers).map((server) => [
          Markup.button.callback(server, `server_${server}`),
        ]),
      ),
    );
  }

  private async sendMainMenu(ctx: Context, session: MenuState): Promise<void> {
    await ctx.reply(
      MESSAGES.SUCCESS_CONNECT(session.server),
      Markup.keyboard([
        [session.paused ? MESSAGES.RESUME : MESSAGES.PAUSE],
        [MESSAGES.SWITCH_SERVER],
      ]).resize(),
    );
  }

  private async togglePause(userId: number, ctx: Context): Promise<void> {
    const session = await this.prisma.botSession.findUnique({
      where: { userId },
    });

    if (!session) {
      await ctx.reply(MESSAGES.NOT_CONNECTED);
      return;
    }

    const updated = await this.prisma.botSession.update({
      where: { userId },
      data: { paused: !session.paused },
    });

    await ctx.reply(
      updated.paused ? MESSAGES.PAUSED : MESSAGES.RESUMED,
      Markup.keyboard([
        [updated.paused ? MESSAGES.RESUME : MESSAGES.PAUSE],
        [MESSAGES.SWITCH_SERVER],
      ]).resize(),
    );
  }

  @Action(/server_(.+)/)
  async onServerSelect(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from.id;
    // @ts-ignore
    const server = ctx.callbackQuery.data.replace('server_', '');

    if (!Object.values(Servers).includes(server as Servers)) {
      await ctx.reply(MESSAGES.WRONG_SERVER);
      return;
    }

    const session = await this.prisma.botSession.findUnique({
      where: { userId },
    });
    if (!session) {
      // Сервер держим в памяти до ввода логина: строку заводим только после
      // успешной проверки пароля.
      this.tempUserServers.set(userId, server);
      await ctx.reply(MESSAGES.ENTER_EMAIL_PASSWORD);
    } else {
      await this.prisma.botSession.update({
        where: { userId },
        data: { server: server as Server },
      });
      await ctx.reply(MESSAGES.SUCCESS_CONNECT(server));
    }
  }

  @On('text')
  async handleText(@Ctx() ctx: Context): Promise<void> {
    // @ts-ignore
    const text = ctx.message.text;
    const userId = ctx.from.id;

    if (text === MESSAGES.PAUSE || text === MESSAGES.RESUME) {
      await this.togglePause(userId, ctx);
      return;
    }
    if (text === MESSAGES.SWITCH_SERVER) {
      await this.onLeave(ctx);
      return;
    }
    await this.handleUserCredentials(ctx);
  }

  private async handleUserCredentials(ctx: Context): Promise<void> {
    const userId = ctx.from.id;
    const server = this.tempUserServers.get(userId);
    if (!server) {
      await ctx.reply(MESSAGES.SELECT_SERVER);
      return;
    }

    // @ts-ignore
    const [email, password] = ctx.message.text.split(' ');
    if (!email || !password) {
      await ctx.reply(MESSAGES.INVALID_FORMAT);
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!user) {
      await ctx.reply(MESSAGES.AUTH_ERROR);
      return;
    }

    const isValidUser: boolean = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!isValidUser) {
      await ctx.reply(MESSAGES.AUTH_ERROR);
      return;
    }

    // Ключ — почта: телеграм-аккаунт у пользователя может смениться, сессия
    // при этом должна остаться одна.
    await this.prisma.botSession.upsert({
      where: { email },
      create: {
        email,
        userId,
        server: server as Server,
        isVerified: true,
        groupName: user.groupName,
      },
      update: {
        userId,
        server: server as Server,
        isVerified: true,
        groupName: user.groupName,
      },
    });

    this.tempUserServers.delete(userId);
    await ctx.deleteMessage();
    await this.sendMainMenu(ctx, {
      server: server as Server,
      paused: false,
    });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size),
    );
  }

  /**
   * Рассылка — побочный эффект обновления моба, а не его часть: метод никогда
   * не бросает наружу и молча пропускает работу, пока Telegram недоступен.
   * Основной сценарий (таймер, сокеты, история) от этого не страдает.
   */
  async notifyGroupUsers(
    groupName: string,
    server: Servers,
    updatedMobName: MobName,
    updatedMobLocation: Locations,
  ): Promise<void> {
    if (!this.connection.isAvailable) {
      this.logger.debug(
        `Telegram недоступен — уведомление по ${updatedMobName} не отправлено`,
      );
      return;
    }

    try {
      const sessions = await this.prisma.botSession.findMany({
        where: {
          paused: false,
          isVerified: true,
          server: server as unknown as Server,
          groupName,
        },
      });
      if (!sessions.length) {
        return;
      }

      const allMobs: GetFullMobWithUnixDtoResponse[] =
        await this.mobService.findAllMobsByGroup(groupName, { server });

      for (const chunk of this.chunkArray(sessions, 28)) {
        // Обрыв связи посреди рассылки — не повод добивать остальные пачки.
        if (!this.connection.isAvailable) {
          this.logger.warn('Telegram отвалился — рассылка прервана');
          return;
        }

        await this.sendBatchMessages(
          chunk,
          allMobs,
          updatedMobName,
          updatedMobLocation,
          server,
        );
      }
    } catch (error) {
      this.logger.error(
        'Ошибка при отправке обновлений пользователям',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async sendBatchMessages(
    sessions: BotSession[],
    allMobs: GetFullMobWithUnixDtoResponse[],
    updatedMobName: MobName,
    updatedMobLocation: Locations,
    server,
  ): Promise<void> {
    await Promise.allSettled(
      sessions.map(async (session: BotSession) => {
        try {
          const user = await this.prisma.user.findFirst({
            where: { email: { equals: session.email, mode: 'insensitive' } },
          });

          if (!user) {
            this.logger.warn(`Пользователь с email ${session.email} не найден`);
            return;
          }

          if (user.excludedMobs.includes(updatedMobName)) {
            return;
          }

          const userMobsMessage = transformFindAllMobsResponse(
            allMobs,
            updatedMobName,
            updatedMobLocation,
            session.timezone,
            server,
          );

          const filteredMessage = filterMobsForUser(
            userMobsMessage,
            user.excludedMobs,
          );

          if (filteredMessage) {
            await this.bot.telegram.sendMessage(
              session.userId,
              filteredMessage,
            );
          }
        } catch (error) {
          this.logSendFailure(session.userId, error);
        }
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  /**
   * 403/400 — это про конкретного получателя (заблокировал бота, удалил чат),
   * а не про доступность Telegram: такие ошибки шумят в логах каждой рассылкой,
   * поэтому пишем их предупреждением, а не ошибкой.
   */
  private logSendFailure(userId: number, error: unknown): void {
    const isRecipientIssue =
      error instanceof TelegramError &&
      (error.code === 400 || error.code === 403);

    if (isRecipientIssue) {
      this.logger.warn(
        `Пользователь ${userId} недоступен: ${(error as TelegramError).description}`,
      );
      return;
    }

    this.logger.error(
      `Ошибка при отправке сообщения пользователю ${userId}`,
      error instanceof Error ? error.stack : String(error),
    );
  }

  @Action('leave')
  async onLeave(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from.id;
    // Строки может не быть: пользователь мог нажать «сменить сервер», ни разу
    // не залогинившись, — updateMany на пустой выборке просто ничего не делает.
    await this.prisma.botSession.updateMany({
      where: { userId },
      data: { server: null },
    });
    await this.sendServerSelection(ctx);
  }
}
