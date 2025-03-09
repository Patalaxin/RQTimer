import { UnauthorizedException } from '@nestjs/common';
import { Action, Ctx, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { InjectModel } from '@nestjs/mongoose';
import { BotSession, BotSessionDocument } from '../schemas/telegram-bot.schema';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Update()
export class TelegramBotService {
  private bcrypt: any;
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    @InjectModel(BotSession.name)
    private sessionModel: Model<BotSessionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    console.log('TelegramBotService created');

    this.bot.on('message', (ctx) => {
      console.log('Получено сообщение:', ctx.message);
    });
  }

  async onStart(ctx: Context) {
    console.log('123');
    const userId = ctx.from.id;
    const existingSession = await this.sessionModel.findOne({ userId });

    if (existingSession) {
      await ctx.reply(`Вы уже подключены к группе ${existingSession.group}.`);
      return;
    }

    await ctx.reply('Привет! Введите группы которую хотите отслеживать:');
  }

  async onMessage(ctx: Context) {
    const userId = ctx.from.id;
    const session = await this.sessionModel.findOne({ userId });

    if (!session) {
      let group: string;
      if ('text' in ctx.message) {
        group = ctx.message.text;
        await ctx.reply(
          'Теперь введите свою почту и пароль (пример: user@example.com 12345):',
        );
      }
      await this.sessionModel.create({ userId, group });
      return;
    }

    let email: string, password: string;

    if ('text' in ctx.message) {
      [email, password] = ctx.message.text.split(' ');
      if (!email || !password) {
        await ctx.reply(
          'Некорректный формат. Введите почту и пароль через пробел.',
        );
        return;
      }
    }

    const isValid = await this.validateUser(email, password);
    if (!isValid) {
      await ctx.reply('Ошибка авторизации. Попробуйте снова.');
      return;
    }

    await this.sessionModel.updateOne(
      { userId },
      { $set: { group: session.group } },
    );

    await ctx.reply(
      `Вы успешно подключены к группе ${session.group}!`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⏸ Пауза', 'pause')],
        [Markup.button.callback('🚪 Выйти', 'leave')],
      ]),
    );

    await this.startSendingUpdates(userId);
  }

  async startSendingUpdates(userId: number) {
    setInterval(
      async () => {
        const session = await this.sessionModel.findOne({ userId });
        if (session && !session.paused) {
          await this.bot.telegram.sendMessage(
            userId,
            `Новая информация для группы ${session.group}`,
          );
        }
      },
      15 * 60 * 1000, // каждые 15 минут
    );
  }

  @Action('pause')
  async onPause(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
    const session = await this.sessionModel.findOne({ userId });

    if (session) {
      session.paused = !session.paused;
      await session.save();

      await ctx.editMessageText(
        session.paused
          ? '⏸ Уведомления приостановлены.'
          : '▶ Уведомления возобновлены.',
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              session.paused ? '▶ Возобновить' : '⏸ Пауза',
              'pause',
            ),
          ],
          [Markup.button.callback('🚪 Выйти', 'leave')],
        ]),
      );
    }
  }

  @Action('leave')
  async onLeave(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
    await this.sessionModel.deleteOne({ userId });

    await ctx.editMessageText('🚪 Вы покинули группу.');
  }

  async validateUser(email: string, password: string): Promise<boolean> {
    const query = { email: new RegExp(`^${email}$`, 'i') };

    const user: User = await this.userModel.findOne(query);
    const isPasswordMatch: boolean = await this.bcrypt.compare(
      password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Login or password invalid');
    }

    return true;
  }

  @Start()
  async handleStart(@Ctx() ctx: Context) {
    console.log('START command received from:', ctx.from);
    await this.onStart(ctx);
  }

  @On('text')
  async handleText(@Ctx() ctx: Context) {
    console.log('User texted the bot:', ctx.from.id);
    await this.onMessage(ctx);
  }
}
