import { Action, Ctx, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { InjectModel } from '@nestjs/mongoose';
import { BotSession, BotSessionDocument } from '../schemas/telegram-bot.schema';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Servers } from '../schemas/mobs.enum';
import { MobService } from '../mob/mob.service';
import { HelperClass } from '../helper-class';
import { MESSAGES } from './messages';
import { GetFullMobWithUnixDtoResponse } from '../mob/dto/get-mob.dto';

@Update()
export class TelegramBotService {
  tempUserServers: Map<number, string> = new Map<number, string>();

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    @InjectModel(BotSession.name)
    private sessionModel: Model<BotSessionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mobService: MobService,
  ) {}

  @Start()
  async handleStart(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from.id;
    const session = await this.sessionModel.findOne({ userId });

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

  private async sendMainMenu(ctx: Context, session: BotSession): Promise<void> {
    await ctx.reply(
      MESSAGES.SUCCESS_CONNECT(session.server),
      Markup.keyboard([
        [session.paused ? MESSAGES.RESUME : MESSAGES.PAUSE],
        [MESSAGES.SWITCH_SERVER],
      ]).resize(),
    );
  }

  private async togglePause(userId: number, ctx: Context): Promise<void> {
    const session = await this.sessionModel.findOne({ userId });

    if (!session) {
      await ctx.reply(MESSAGES.NOT_CONNECTED);
      return;
    }

    session.paused = !session.paused;
    await session.save();

    await ctx.reply(
      session.paused ? MESSAGES.PAUSED : MESSAGES.RESUMED,
      Markup.keyboard([
        [session.paused ? MESSAGES.RESUME : MESSAGES.PAUSE],
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

    const session = await this.sessionModel.findOne({ userId });
    if (!session) {
      this.tempUserServers.set(userId, server);
      await ctx.reply(MESSAGES.ENTER_EMAIL_PASSWORD);
    } else {
      await this.sessionModel.updateOne(
        { userId },
        { $set: { server } },
        { upsert: true },
      );
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

    if (!(await this.validateUser(email, password))) {
      await ctx.reply(MESSAGES.AUTH_ERROR);
      return;
    }

    await this.sessionModel.updateOne(
      { userId },
      { $set: { server, isVerified: true, email } },
      { upsert: true },
    );
    this.tempUserServers.delete(userId);
    await ctx.deleteMessage();
    await this.sendMainMenu(ctx, {
      userId,
      server,
      paused: false,
    } as BotSession);
  }

  private async validateUser(
    email: string,
    password: string,
  ): Promise<boolean> {
    const user = await this.userModel.findOne({
      email: new RegExp(`^${email}$`, 'i'),
    });
    return user ? bcrypt.compare(password, user.password) : false;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async startSendingUpdates(): Promise<void> {
    const sessions = await this.sessionModel.find({
      paused: false,
      isVerified: true,
      server: { $ne: null },
    });
    for (const chunk of this.chunkArray(sessions, 28)) {
      await this.sendBatchMessages(chunk);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size),
    );
  }

  private async sendBatchMessages(sessions: BotSession[]): Promise<void> {
    await Promise.allSettled(
      sessions.map(async (session) => {
        try {
          const mobsInfo: GetFullMobWithUnixDtoResponse[] =
            await this.mobService.findAllMobsByUser(session.email, {
              server: session.server,
            });
          const response =
            await HelperClass.transformFindAllMobsResponse(mobsInfo);
          if (response) {
            await this.bot.telegram.sendMessage(
              session.userId,
              MESSAGES.NEW_INFO(session, response),
            );
          }
        } catch (error) {
          console.error(
            `Ошибка при отправке сообщения пользователю ${session.userId}:`,
            error,
          );
        }
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  @Action('leave')
  async onLeave(@Ctx() ctx: Context): Promise<void> {
    const userId = ctx.from.id;
    await this.sessionModel.updateOne(
      { userId },
      { $set: { server: null } },
      { upsert: true },
    );
    await this.sendServerSelection(ctx);
  }
}
