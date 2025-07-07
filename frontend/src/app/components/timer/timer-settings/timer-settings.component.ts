import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { GroupsService } from 'src/app/services/groups.service';
import { WebsocketService } from '../../../services/websocket.service';
import { TranslateService } from '@ngx-translate/core';
import { TimerService } from 'src/app/services/timer.service';

@Component({
  selector: 'app-timer-settings',
  templateUrl: './timer-settings.component.html',
  styleUrls: ['./timer-settings.component.scss'],
})
export class TimerSettingsComponent implements OnInit {
  private readonly groupsService = inject(GroupsService);
  private readonly timerService = inject(TimerService);
  private readonly modalService = inject(NzModalService);
  private readonly translateService = inject(TranslateService);
  private readonly messageService = inject(NzMessageService);
  private readonly websocketService = inject(WebsocketService);

  @Input() isGroupLeader: boolean = false;
  @Input() groupName: any;
  @Input() currentUser: any;
  @Input() userList: any;
  @Input() groupLeaderEmail: string = '';
  @Input() onlineUserList: any[] = [];
  @Input() canMembersAddMobs: boolean = false;

  @Output() exchangeRefresh: EventEmitter<any> = new EventEmitter<any>();
  @Output() updateGroup: EventEmitter<any> = new EventEmitter<any>();

  userGroupList: any = [];
  inviteCode: string = '';
  isGenerateLoading: boolean = false;
  isDeleteGroupLoading: boolean = false;
  isLeaveGroupLoading: boolean = false;
  isTableLoading: boolean = false;
  listOfCurrentPageData: any[] = [];
  pageIndex: number = 1;
  pageSize: number = 10;
  isSearchVisible: boolean = false;
  searchValue: string = '';
  sortStatus: any = (a: any, b: any) =>
    Number(this.onlineUserList.includes(b.email)) -
    Number(this.onlineUserList.includes(a.email));

  isScreenWidth550: boolean = false;

  switchVoiceValue = false;
  switchAddMobsValue = false;
  isSwitchLoading = false;

  volume: string = localStorage.getItem('volume') || '50';
  language: string = 'ru';

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenWidth();
  }

  constructor() {
    this.websocketService.emitGetOnlineUserList();
  }

  ngOnInit(): void {
    this.timerService.language$.subscribe({
      next: (res) => {
        this.language = res || localStorage.getItem('language') || 'ru';
      },
    });

    this.timerService.switchVoice$.subscribe({
      next: (res) => {
        this.switchVoiceValue = res;
      },
    });

    this.switchAddMobsValue = this.canMembersAddMobs;
    // this.switchVoiceValue = JSON.parse(
    //   localStorage.getItem('specialNotification') || 'false',
    // );
    this.checkScreenWidth();
    this.getGroupUsers();
  }

  private checkScreenWidth(): void {
    this.isScreenWidth550 = window.innerWidth <= 550;
  }

  volumeFormatter(value: number): string {
    return `${value}%`;
  }

  volumeChange(event: any): any {
    localStorage.setItem('volume', event);
    const volume = Number(localStorage.getItem('volume') || '50') / 100;
    const audio = new Audio('../../../assets/audio/notification.mp3');
    audio.volume = volume;
    audio.play();
  }

  clickVoiceSwitch(): void {
    this.switchVoiceValue = !this.switchVoiceValue;
    localStorage.setItem(
      'specialNotification',
      JSON.stringify(this.switchVoiceValue),
    );
    this.messageService.create(
      'success',
      `${this.switchVoiceValue ? this.translateService.instant('TIMER_SETTINGS.MESSAGE.VOICE_SETTING_ACTIVATED') : this.translateService.instant('TIMER_SETTINGS.MESSAGE.VOICE_SETTING_DEACTIVATED')}`,
    );
  }

  clickAddMobsSwitch(): void {
    if (!this.isSwitchLoading) {
      this.isSwitchLoading = true;

      this.groupsService.updateGroup(!this.switchAddMobsValue).subscribe({
        next: () => {
          this.switchAddMobsValue = !this.switchAddMobsValue;
          this.updateGroup.emit(this.switchAddMobsValue);
          this.messageService.create(
            'success',
            `${this.switchAddMobsValue ? this.translateService.instant('TIMER_SETTINGS.MESSAGE.MEMBERS_CAN_EDIT_MOBS') : this.translateService.instant('TIMER_SETTINGS.MESSAGE.MEMBERS_CANNOT_EDIT_MOBS')}`,
          );
          this.isSwitchLoading = false;
        },
        error: () => {
          this.isSwitchLoading = false;
        },
      });
    }
  }

  onInviteCodeClick(inviteCode: string) {
    this.messageService.create(
      'success',
      this.translateService.instant('TIMER_SETTINGS.MESSAGE.INVITE_COPIED'),
    );
    navigator.clipboard.writeText(inviteCode);
  }

  onGenerateInviteCode() {
    this.isGenerateLoading = true;
    this.groupsService.generateInviteGroup().subscribe({
      next: (res) => {
        this.inviteCode = res.inviteCode;
        this.isGenerateLoading = false;
      },
      error: () => {
        this.isGenerateLoading = false;
      },
    });
  }

  onCurrentPageDataChange(listOfCurrentPageData: any): void {
    this.isTableLoading = true;
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.isTableLoading = false;
  }

  onPageIndexChange(pageIndex: any): void {
    this.pageIndex = pageIndex;
  }

  onReset(): void {
    this.searchValue = '';
    this.onSearch();
  }

  onSearch(): void {
    this.isSearchVisible = false;
    this.userList = this.userGroupList.filter(
      (item: any) => item.nickname.indexOf(this.searchValue) !== -1,
    );
  }

  getGroupUsers(email?: any, mode?: 'transfer' | 'delete'): void {
    this.userGroupList = [];
    this.groupsService.getGroup().subscribe({
      next: (res) => {
        res.members.map((member: string) => {
          let nickname: string = member.split(': ')[0];
          let email: string = member.split(': ')[1];
          this.userGroupList.push({ nickname, email });
        });
        this.userGroupList.forEach((item: any, i: any) => {
          item.id = i++;
        });

        this.userList = [...this.userGroupList];
        this.isTableLoading = false;

        if (mode === 'delete') {
          this.messageService.create(
            'success',
            this.translateService.instant(
              'TIMER_SETTINGS.MESSAGE.USER_DELETED',
              { email: email },
            ),
          );
        }

        if (mode === 'transfer') {
          this.messageService.create(
            'success',
            this.translateService.instant(
              'TIMER_SETTINGS.MESSAGE.USER_ASSIGNED_AS_LEADER',
              { email: email },
            ),
          );

          this.exchangeRefresh.emit();
        }
      },
    });
  }

  onShowTransferModal(nickname: string, email: string): void {
    this.modalService.confirm({
      nzTitle: this.translateService.instant(
        'TIMER_SETTINGS.MODAL.CONFIRM_ASSIGN_LEADER_TITLE',
      ),
      nzContent: this.translateService.instant(
        'TIMER_SETTINGS.MODAL.CONFIRM_ASSIGN_LEADER_MESSAGE',
        { nickname: nickname },
      ),
      nzOkText: this.translateService.instant('COMMON.BUTTONS.YES'),
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onTransfer(email),
      nzCancelText: this.translateService.instant('COMMON.BUTTONS.NO'),
    });
  }

  onTransfer(email: string): void {
    this.isTableLoading = true;
    this.groupsService.transferLeaderGroup(email).subscribe({
      next: () => {
        this.getGroupUsers(email, 'transfer');
      },
      error: () => {
        this.isTableLoading = false;
      },
    });
  }

  onShowDeleteModal(nickname: string, email: string): void {
    this.modalService.confirm({
      nzTitle: this.translateService.instant(
        'TIMER_SETTINGS.MODAL.CONFIRM_DELETE_USER_TITLE',
      ),
      nzContent: this.translateService.instant(
        'TIMER_SETTINGS.MODAL.CONFIRM_DELETE_USER_MESSAGE',
        { nickname: nickname },
      ),
      nzOkText: this.translateService.instant('COMMON.BUTTONS.YES'),
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onDelete(email),
      nzCancelText: this.translateService.instant('COMMON.BUTTONS.NO'),
    });
  }

  onDelete(email: string): void {
    this.isTableLoading = true;
    this.groupsService.deleteUser(email).subscribe({
      next: () => {
        this.getGroupUsers(email, 'delete');
      },
      error: () => {
        this.isTableLoading = false;
      },
    });
  }

  onShowDeleteGroupModal(): void {
    this.modalService.confirm({
      nzTitle: this.translateService.instant(
        'TIMER_SETTINGS.MODAL.CONFIRM_DELETE_GROUP_TITLE',
      ),
      nzContent: this.translateService.instant(
        'TIMER_SETTINGS.MODAL.CONFIRM_DELETE_GROUP_MESSAGE',
        { groupName: this.groupName },
      ),
      nzOkText: this.translateService.instant('COMMON.BUTTONS.YES'),
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onDeleteGroup(),
      nzCancelText: this.translateService.instant('COMMON.BUTTONS.NO'),
    });
  }

  onDeleteGroup(): void {
    this.isDeleteGroupLoading = true;
    this.groupsService.deleteGroup().subscribe({
      next: () => {
        this.messageService.create(
          'success',
          this.translateService.instant(
            'TIMER_SETTINGS.MESSAGE.GROUP_DELETED',
            {
              groupName: this.groupName,
            },
          ),
        );
        this.exchangeRefresh.emit();
      },
      error: () => {
        this.isDeleteGroupLoading = false;
      },
    });
  }

  onShowLeaveGroupModal(): void {
    this.modalService.confirm({
      nzTitle: this.translateService.instant(
        'TIMER_SETTINGS.MODAL.CONFIRM_LEAVE_GROUP_TITLE',
      ),
      nzContent: this.translateService.instant(
        'TIMER_SETTINGS.MODAL.CONFIRM_LEAVE_GROUP_MESSAGE',
        { groupName: this.groupName },
      ),
      nzOkText: this.translateService.instant('COMMON.BUTTONS.YES'),
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onLeaveGroup(),
      nzCancelText: this.translateService.instant('COMMON.BUTTONS.NO'),
    });
  }

  onLeaveGroup(): void {
    this.isLeaveGroupLoading = true;
    this.groupsService.leaveGroup().subscribe({
      next: () => {
        this.messageService.create(
          'success',
          this.translateService.instant('TIMER_SETTINGS.MESSAGE.LEFT_GROUP', {
            groupName: this.groupName,
          }),
        );
        this.exchangeRefresh.emit();
      },
      error: () => {
        this.isLeaveGroupLoading = false;
      },
    });
  }
}
