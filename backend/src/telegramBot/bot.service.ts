import { BadRequestException, Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import * as process from 'process';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Servers } from '../schemas/mobs.enum';

@Injectable()
export class TelegramBotService {
  private botModel: any;
  private bot: TelegramBot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
    polling: true,
  });
  constructor(private readonly schedulerRegistry: SchedulerRegistry) {
    this.botModel = [
      {
        server: 'Гранас',
        token: process.env.GRANAS_TOKEN,
      },
      {
        server: 'Энигма',
        token: process.env.ENIGMA_TOKEN,
      },
      {
        server: 'Логрус',
        token: process.env.LOGRUS_TOKEN,
      },
    ];
  }

  async newTimeout(
    name: string,
    respawnTime: number,
    mobName: string,
    server: Servers,
  ): Promise<void> {
    try {
      const time: number = respawnTime - Date.now() - 300000;
      if (time <= Date.now()) {
        return;
      }
      const callback = () => {
        const botToken = this.botModel.find(
          (obj) => obj.server === server,
        ).token;
        this.bot.sendMessage(
          botToken,
          `${mobName} реснется меньше чем через 5 минут!!!`,
        );
        this.bot.stopPolling();
        this.schedulerRegistry.deleteTimeout(name);
      };

      const timeout = setTimeout(callback, time);
      this.schedulerRegistry.addTimeout(name, timeout);
    } catch (err) {
      throw new BadRequestException(
        'Something get wrong with telegram bot :( ',
      );
    }
  }
}
