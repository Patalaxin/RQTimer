import { Server } from '@prisma/client';

/**
 * В Mongo за годы накопились сервера, которых в игре больше нет: закрытые
 * (Solus, Pyros, Astus, Ortos, Aztec) и старые кириллические написания
 * (Гелиос, Игнис). Приложение о них не знает — enum Servers содержит только
 * Helios и Fenix, и любой запрос фильтрует по нему, — так что эти строки
 * недоступны уже сейчас. При переносе они пропускаются.
 */
export function isKnownServer(value: unknown): value is Server {
  return (
    typeof value === 'string' && Object.values(Server).includes(value as Server)
  );
}

/** Копит пропущенное по значению сервера, чтобы отчитаться одной сводкой. */
export class SkippedServers {
  private readonly counts = new Map<string, number>();

  add(server: unknown): void {
    const key =
      server === null || server === undefined ? '(пусто)' : String(server);
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
  }

  get total(): number {
    return [...this.counts.values()].reduce((sum, n) => sum + n, 0);
  }

  /** `label` — фраза целиком, без счётчика: «Пропущено записей». */
  report(label: string): void {
    if (!this.counts.size) {
      return;
    }

    const breakdown = [...this.counts.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([server, n]) => `${server}: ${n}`)
      .join(', ');

    console.log(`${label}: ${this.total} (${breakdown})`);
  }
}
