import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss'],
})
export class LogComponent {
  @Input() historyList: any;

  getInputMethod(item: any): string {
    const methods: { [key: string]: string } = {
      updateMobByCooldown: `по кд ${item.toCooldown - item.fromCooldown} раз`,
      updateMobDateOfDeath: 'по точному времени смерти',
      updateMobDateOfRespawn: 'по точному времени респауна',
      crashMobServer: 'всех боссов/элиток из-за краша сервера',
      respawnLost: 'как утерянный респаун',
    };

    return methods[item.historyTypes] || 'по тупому';
  }
}
