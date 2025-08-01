import { Component, HostListener, inject, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from 'src/app/services/notification.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly modalService = inject(NzModalService);
  private readonly messageService = inject(NzMessageService);
  private readonly translateService = inject(TranslateService);

  @Input() bossList: string[] = [];
  @Input() eliteList: string[] = [];

  userList: any = [];
  userSearchList: any = [];
  userData: any;
  isUserDataLoading: boolean = false;
  isTableLoading: boolean = false;
  isGenerateLoading: boolean = false;
  sortRole: any = (a: any, b: any) => a.role.localeCompare(b.role);
  sortGroupName: any = (a: any, b: any) =>
    String(a.groupName).localeCompare(String(b.groupName));

  listOfCurrentPageData: any[] = [];
  pageIndex: number = 1;
  pageSize: number = 10;
  isSearchVisible: boolean = false;
  searchValue: string = '';

  isRoleChanged: boolean = false;
  roleList = ['Admin', 'User'];

  currentUser: any;

  isScreenWidth800: boolean = false;
  isScreenWidth550: boolean = false;

  availableBossList: any;
  availableEliteList: any;

  isCreateNotificationModalVisible: boolean = false;
  isCreateNotificationOkLoading: boolean = false;

  russianText: string = '';
  englishText: string = '';

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenWidth();
  }

  ngOnInit(): void {
    this.checkScreenWidth();
    this.getAllUsers();

    this.userService.currentUser$.subscribe({
      next: (res) => {
        this.currentUser = res;
      },
    });
  }

  private checkScreenWidth(): void {
    this.isScreenWidth800 = window.innerWidth <= 800;
    this.isScreenWidth550 = window.innerWidth <= 550;
  }

  showCreateNotificationModal(): void {
    event?.stopPropagation();
    this.isCreateNotificationModalVisible = true;
  }

  confirmCreateNotificationModal(): void {
    this.isCreateNotificationOkLoading = true;
    this.notificationService
      .createNotification(this.russianText, this.englishText)
      .subscribe({
        next: () => {
          this.isCreateNotificationOkLoading = false;
          this.isCreateNotificationModalVisible = false;
          this.russianText = '';
          this.englishText = '';
          this.messageService.create(
            'success',
            this.translateService.instant('ADMIN.MESSAGE.NOTIFICATION_CREATED'),
          );
        },
        error: () => {
          this.isCreateNotificationOkLoading = false;
        },
      });
  }

  cancelCreateNotificationModal(): void {
    this.isCreateNotificationModalVisible = false;
    this.russianText = '';
    this.englishText = '';
  }

  getUserColor(role: string): any {
    return role == 'Admin' ? 'volcano' : 'lime';
  }

  getAllUsers(nickname?: any, params?: any): void {
    this.isTableLoading = true;
    this.userService
      .getAllUsers(
        params?.pageIndex || this.pageIndex,
        params?.pageSize || this.pageSize,
      )
      .subscribe({
        next: (res) => {
          this.userSearchList = res;
          this.userSearchList?.data.forEach((item: any, i: any) => {
            item.id = i++;
            item.isUserModalVisible = false;
            item.isUserOkLoading = false;
          });

          this.userList = { ...this.userSearchList };
          this.isTableLoading = false;

          if (nickname) {
            this.messageService.create(
              'success',
              this.translateService.instant('ADMIN.MESSAGE.USER_DELETED', {
                nickname: nickname,
              }),
            );
          }
        },
      });
  }

  // onQueryParamsChange(params: any): void {
  //   console.log(params);
  //   const { pageSize, pageIndex, sort, filter } = params;
  //   this.getAllUsers(undefined, { pageSize, pageIndex });
  // }

  onPageIndexChange(pageIndex: any): void {
    this.getAllUsers(undefined, { pageSize: this.pageSize, pageIndex });
  }

  onReset(): void {
    this.searchValue = '';
    this.onSearch();
  }

  onSearch(): void {
    this.isSearchVisible = false;
    this.userList.data = this.userSearchList.data.filter(
      (item: any) => item.nickname.indexOf(this.searchValue) !== -1,
    );
  }

  // onCurrentPageDataChange(listOfCurrentPageData: any): void {
  //   this.isTableLoading = true;
  //   this.listOfCurrentPageData = listOfCurrentPageData;
  //   this.isTableLoading = false;
  // }

  // onPageIndexChange(pageIndex: any): void {
  //   this.pageIndex = pageIndex;
  // }

  getSpecificUser(nickname: string): void {
    this.isUserDataLoading = true;
    this.userService.getSpecificUser(nickname).subscribe({
      next: (res) => {
        this.userData = res;
        this.availableBossList = this.bossList.filter(
          (item: any) => !res.unavailableMobs.includes(item),
        );
        this.availableEliteList = this.eliteList.filter(
          (item: any) => !res.unavailableMobs.includes(item),
        );
        this.isUserDataLoading = false;
      },
    });
  }

  onShowDeleteModal(nickname: string): void {
    this.modalService.confirm({
      nzTitle: this.translateService.instant('ADMIN.MODAL.USER_DELETION_TITLE'),
      nzContent: this.translateService.instant(
        'ADMIN.MODAL.USER_DELETION_MESSAGE',
        { nickname: nickname },
      ),
      nzOkText: this.translateService.instant('COMMON.BUTTONS.YES'),
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onDelete(nickname),
      nzCancelText: this.translateService.instant('COMMON.BUTTONS.NO'),
    });
  }

  onShowUserModal(item: any): void {
    this.getSpecificUser(item.nickname);
    item.isUserModalVisible = true;
  }

  confirmUserModal(item: any): void {
    if (this.isRoleChanged) {
      let role = item.role === 'Admin' ? 'User' : 'Admin';

      this.userService.updateRole(item.nickname, role).subscribe({
        next: () => {
          this.messageService.create(
            'success',
            this.translateService.instant('ADMIN.MESSAGE.USER_ROLE_UPDATED', {
              nickname: item.nickname,
            }),
          );
        },
      });
    }

    let unavailableBossList = this.bossList.filter(
      (item: any) => !this.availableBossList.includes(item),
    );
    let unavailableEliteList = this.eliteList.filter(
      (item: any) => !this.availableEliteList.includes(item),
    );

    this.isTableLoading = true;
    item.isUserModalVisible = false;

    this.userService
      .updateUnavailable(item.nickname, [
        ...unavailableBossList,
        ...unavailableEliteList,
      ])
      .subscribe({
        next: () => {
          this.getAllUsers();
          this.messageService.create(
            'success',
            this.translateService.instant(
              'ADMIN.MESSAGE.USER_ACCESS_SETTINGS_UPDATED',
              { nickname: item.nickname },
            ),
          );
        },
      });
  }

  cancelUserModal(item: any): void {
    item.isUserModalVisible = false;
  }

  onDelete(nickname: string): void {
    this.isTableLoading = true;
    this.userService.deleteUser(nickname).subscribe({
      next: () => {
        this.getAllUsers(nickname);
      },
    });
  }

  onRoleChange(event: any, role: string): void {
    this.isRoleChanged = role !== event;
  }
}
