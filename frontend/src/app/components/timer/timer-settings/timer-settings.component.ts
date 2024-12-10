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

@Component({
  selector: 'app-timer-settings',
  templateUrl: './timer-settings.component.html',
  styleUrls: ['./timer-settings.component.scss'],
})
export class TimerSettingsComponent implements OnInit {
  private readonly groupsService = inject(GroupsService);
  private readonly modalService = inject(NzModalService);
  private readonly messageService = inject(NzMessageService);

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

  switchValue = false;
  isSwitchLoading = false;

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenWidth();
  }

  ngOnInit(): void {
    this.switchValue = this.canMembersAddMobs;
    this.checkScreenWidth();
    this.getGroupUsers();
  }

  private checkScreenWidth(): void {
    this.isScreenWidth550 = window.innerWidth <= 550;
  }

  clickSwitch(): void {
    if (!this.isSwitchLoading) {
      this.isSwitchLoading = true;

      this.groupsService.updateGroup(!this.switchValue).subscribe({
        next: () => {
          this.switchValue = !this.switchValue;
          this.updateGroup.emit(this.switchValue);
          this.isSwitchLoading = false;
        },
        error: () => {
          this.isSwitchLoading = false;
        },
      });
    }
  }

  onInviteCodeClick(inviteCode: string) {
    this.messageService.create('success', `Инвайт успешно скопирован!`);
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
          this.messageService.create('success', `Пользователь ${email} удалён`);
        }

        if (mode === 'transfer') {
          this.messageService.create(
            'success',
            `Пользователь ${email} назначен лидером`,
          );

          this.exchangeRefresh.emit();
        }
      },
    });
  }

  onShowTransferModal(nickname: string, email: string): void {
    this.modalService.confirm({
      nzTitle: 'Внимание',
      nzContent: `<b style="color: red;">Вы точно хотите назначить пользователя ${nickname} лидером?</b>`,
      nzOkText: 'Да',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onTransfer(email),
      nzCancelText: 'Нет',
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
      nzTitle: 'Внимание',
      nzContent: `<b style="color: red;">Вы точно хотите удалить пользователя ${nickname}?</b>`,
      nzOkText: 'Да',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onDelete(email),
      nzCancelText: 'Нет',
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
      nzTitle: 'Внимание',
      nzContent: `<b style="color: red;">Вы точно хотите удалить группу ${this.groupName}?</b>`,
      nzOkText: 'Да',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onDeleteGroup(),
      nzCancelText: 'Нет',
    });
  }

  onDeleteGroup(): void {
    this.isDeleteGroupLoading = true;
    this.groupsService.deleteGroup().subscribe({
      next: () => {
        this.messageService.create(
          'success',
          `Группа ${this.groupName} была успешно удалена`,
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
      nzTitle: 'Внимание',
      nzContent: `<b style="color: red;">Вы точно хотите покинуть группу ${this.groupName}?</b>`,
      nzOkText: 'Да',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onLeaveGroup(),
      nzCancelText: 'Нет',
    });
  }

  onLeaveGroup(): void {
    this.isLeaveGroupLoading = true;
    this.groupsService.leaveGroup().subscribe({
      next: () => {
        this.messageService.create(
          'success',
          `Вы успешно вышли из группы ${this.groupName}`,
        );
        this.exchangeRefresh.emit();
      },
      error: () => {
        this.isLeaveGroupLoading = false;
      },
    });
  }
}
