import { Component, inject, Input, OnInit } from '@angular/core';
import * as moment from 'moment-timezone';

import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-mob-modal',
  templateUrl: './mob-modal.component.html',
  styleUrls: ['./mob-modal.component.scss'],
})
export class MobModalComponent implements OnInit {
  private readonly timerService = inject(TimerService);
  private readonly storageService = inject(StorageService);

  IMAGE_SRC = environment.url + '/static/api/';

  @Input() item: any;

  isLoading: boolean = true;
  itemCooldownTime: number | null = null;
  itemData: any;

  ngOnInit(): void {
    let userTimezone = moment.tz.guess();
    let diffTimeZone = moment.tz(userTimezone).utcOffset() * 60000;

    if (this.item) {
      this.itemCooldownTime = moment(
        this.item.mob.cooldownTime + 946598400000 - diffTimeZone,
      ).valueOf();
    }

    this.getMob();
  }

  getMob() {
    const lang = localStorage.getItem('language') || 'ru';
    this.timerService.getMob(this.item.mobData.mobId, lang).subscribe({
      next: (res) => {
        this.itemData = res;
        this.isLoading = false;
      },
    });
  }
}
