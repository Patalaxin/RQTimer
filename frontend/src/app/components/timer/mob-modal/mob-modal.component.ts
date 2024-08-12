import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import * as moment from 'moment-timezone';

import { TimerItem } from 'src/app/interfaces/timer-item';
import { ConfigurationService } from 'src/app/services/configuration.service';

export interface CreateItem {
  mobName?: string;
  shortName?: string;
  location?: string;
  respawnText?: string;
  image?: string;
  cooldownTime?: number;
  mobType?: string;
  currentLocation?: string;
}

@Component({
  selector: 'app-mob-modal',
  templateUrl: './mob-modal.component.html',
  styleUrls: ['./mob-modal.component.scss'],
})
export class MobModalComponent implements OnInit {
  private configurationService = inject(ConfigurationService);

  @Input() item: TimerItem | undefined;
  @Output() onCreateEdit: EventEmitter<any> = new EventEmitter<any>();

  isLoading: boolean = true;
  mobList: any;
  mobTypeList = ['Босс', 'Элитка'];
  locationList: string[] = [];

  selectedMobType: string = 'Босс';
  selectedMobName: string | null = null;
  selectedLocation: string | null = null;
  selectedCooldownTime: number | null = null;

  createEditItem: CreateItem = {};

  ngOnInit(): void {
    let userTimezone = moment.tz.guess();
    let diffTimeZone = moment.tz(userTimezone).utcOffset() * 60000;

    if (this.item) {
      this.selectedMobType = this.item.mob.mobType;
      this.selectedMobName = this.item.mob.mobName;
      this.selectedLocation = this.item.mob.location;
      this.selectedCooldownTime = moment(
        this.item.mob.cooldownTime + 946598400000 - diffTimeZone
      ).valueOf();
      this.createEditItem = {
        mobName: this.item.mob.mobName,
        shortName: this.item.mob.shortName,
        location: this.item.mob.location,
        respawnText: this.item.mob.respawnText,
        image: this.item.mob.image,
        cooldownTime: this.formatCooldownTime(this.item.mob.cooldownTime, true),
        mobType: this.item.mob.mobType,
        currentLocation: this.item.mob.location,
      };
    }
    this.getMobs();
  }

  getMobs(): void {
    this.configurationService.getMobs().subscribe({
      next: (res) => {
        this.mobList = res;
        this.getLocations();
      },
    });
  }

  getLocations(): void {
    this.configurationService.getLocations().subscribe({
      next: (res) => {
        this.locationList = res;
        this.isLoading = false;
      },
    });
  }

  onMobTypeChange(mobType: string): void {
    const mobArray =
      mobType === 'Босс' ? this.mobList.bossesArray : this.mobList.elitesArray;
    this.selectedMobName = mobArray[0].mobName;
    if (this.selectedMobName) {
      this.onMobChange(this.selectedMobName);
    }
  }

  onMobChange(mobName: string) {
    console.log(mobName);
    this.createEditItem = {
      ...this.filterByMobName(this.selectedMobType, mobName),
    };
    this.onCreateEdit.emit(this.createEditItem);
  }

  onLocationChange(location: string) {
    this.createEditItem.location = location;
    this.onCreateEdit.emit(this.createEditItem);
  }

  onCooldownTimeChange(cooldownTime: string) {
    this.createEditItem.cooldownTime = this.formatCooldownTime(
      moment(cooldownTime).valueOf()
    );
    this.onCreateEdit.emit(this.createEditItem);
  }

  filterByMobName(mobType: string, mobName: string): any {
    const mobArray =
      mobType === 'Босс' ? this.mobList.bossesArray : this.mobList.elitesArray;
    return mobArray.find((mob: any) => mob.mobName === mobName);
  }

  private formatCooldownTime(
    cooldownTime: number,
    utc: boolean = false
  ): number {
    const date = new Date(cooldownTime);
    return utc
      ? date.getUTCHours() * 3600000 +
          date.getUTCMinutes() * 60000 +
          date.getUTCSeconds() * 1000
      : date.getHours() * 3600000 +
          date.getMinutes() * 60000 +
          date.getSeconds() * 1000;
  }
}
