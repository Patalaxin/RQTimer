import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
// import * as moment from 'moment';
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

  constructor(private configurationService: ConfigurationService) {}

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
        console.log('mobList', this.mobList);
        console.log('locationList', this.locationList);
      },
    });
  }

  onMobTypeChange(mobType: string) {
    if (mobType === 'Босс') {
      this.selectedMobName = this.mobList.bossesArray[0].mobName;
      return;
    }
    this.selectedMobName = this.mobList.elitesArray[0].mobName;
    return;
  }

  onMobChange(mobName: string) {
    this.createEditItem = {
      ...this.filterByMobName(this.selectedMobType, mobName),
    };

    console.log(
      'this.filterByMobName(this.selectedMobType, mobName)',
      this.createEditItem
    );
    this.onCreateEdit.emit(this.createEditItem);
  }

  onLocationChange(location: string) {
    this.createEditItem.location = location;
    console.log('cooldownTime', this.createEditItem);
    this.onCreateEdit.emit(this.createEditItem);
  }

  onCooldownTimeChange(cooldownTime: string) {
    this.createEditItem.cooldownTime = this.formatCooldownTime(
      moment(cooldownTime).valueOf()
    );
    console.log('cooldownTime', this.createEditItem);

    this.onCreateEdit.emit(this.createEditItem);
  }

  formatCooldownTime(cooldownTime: number, utc: boolean = false) {
    let date = new Date(cooldownTime);
    let formattedCooldownTime: number = 0;

    if (utc) {
      formattedCooldownTime =
        date.getUTCHours() * 60 * 60 * 1000 +
        date.getUTCMinutes() * 60 * 1000 +
        date.getUTCSeconds() * 1000;

      console.log('utc format', formattedCooldownTime);
      return formattedCooldownTime;
    }

    formattedCooldownTime =
      date.getHours() * 60 * 60 * 1000 +
      date.getMinutes() * 60 * 1000 +
      date.getSeconds() * 1000;

    console.log('format', formattedCooldownTime);

    return formattedCooldownTime;
  }

  filterByMobName(mobType: string, mobName: string) {
    if (mobType === 'Босс') {
      return this.mobList.bossesArray.find(
        (mob: any) => mob.mobName === mobName
      );
    }
    return this.mobList.elitesArray.find((mob: any) => mob.mobName === mobName);
  }

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
}
