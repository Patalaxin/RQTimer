import { Component, HostListener, inject, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AuthService } from 'src/app/services/auth.service';
import { StorageService } from 'src/app/services/storage.service';
import { TimerService } from 'src/app/services/timer.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly timerService = inject(TimerService);
  private readonly storageService = inject(StorageService);
  private readonly modalService = inject(NzModalService);
  private readonly messageService = inject(NzMessageService);

  @Input() bossList: string[] = [];
  @Input() eliteList: string[] = [];

  userList: any = [];
  userSearchList: any = [];
  userData: any;
  isUserDataLoading: boolean = false;
  isTableLoading: boolean = false;
  isGenerateLoading: boolean = false;

  listOfCurrentPageData: any[] = [];
  isSearchVisible: boolean = false;
  searchValue: string = '';

  isRoleChanged: boolean = false;
  roleList = ['Admin', 'User'];

  sessionId: string = '';

  currentUser: any;

  isScreenWidth800: boolean = false;
  isScreenWidth550: boolean = false;

  availableBossList: any;
  availableEliteList: any;

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
        console.log(this.currentUser);
      },
    });
  }

  private exchangeRefresh(callback: Function) {
    let key =
      this.storageService.getLocalStorage('email') ||
      this.storageService.getLocalStorage('nickname');
    this.authService.exchangeRefresh(key).subscribe({
      next: (res) => {
        console.log('exchangeRefresh', res);
        this.storageService.setLocalStorage(key, res.accessToken);
        if (callback && typeof callback === 'function') {
          callback(); // Вызываем коллбэк
        }
      },
      error: (err) => {
        console.log('getUser error', err);
        if (err.status === 401) {
          this.onLogout();
        }
      },
    });
  }

  private checkScreenWidth(): void {
    this.isScreenWidth800 = window.innerWidth <= 800;
    this.isScreenWidth550 = window.innerWidth <= 550;
  }

  onLogout(): void {
    this.authService.signOut().subscribe({
      next: () => {
        this.timerService.headerVisibility = false;
        this.storageService.clean();
        this.router.navigate(['/login']);
      },
    });
  }

  getUserColor(role: string): any {
    return role == 'Admin' ? 'red' : 'green';
  }

  getAllUsers(nickname?: any): void {
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        console.log('getAllUsers', res);
        this.userSearchList = res;
        this.userSearchList.forEach((item: any, i: any) => {
          item.id = i++;
          item.isUserModalVisible = false;
          item.isUserOkLoading = false;
        });

        this.userList = [...this.userSearchList];
        this.isTableLoading = false;

        if (nickname) {
          this.messageService.create(
            'success',
            `Пользователь ${nickname} удалён`,
          );
        }
      },
      error: (err) => {
        if (err.status === 401) {
          this.exchangeRefresh(() => {
            this.getAllUsers(nickname);
          });
        }
      },
    });
  }

  onReset(): void {
    this.searchValue = '';
    this.onSearch();
  }

  onSearch(): void {
    this.isSearchVisible = false;
    this.userList = this.userSearchList.filter(
      (item: any) => item.nickname.indexOf(this.searchValue) !== -1,
    );
  }

  onCurrentPageDataChange(listOfCurrentPageData: any): void {
    this.isTableLoading = true;
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.isTableLoading = false;
  }

  getSpecificUser(nickname: string): void {
    console.log('click');
    this.isUserDataLoading = true;
    this.userService.getSpecificUser(nickname).subscribe({
      next: (res) => {
        this.userData = res;
        console.log('getSpecificUser', res);
        this.availableBossList = this.bossList.filter(
          (item: any) => !res.unavailableMobs.includes(item),
        );
        this.availableEliteList = this.eliteList.filter(
          (item: any) => !res.unavailableMobs.includes(item),
        );
        this.isUserDataLoading = false;
      },
      error: (err) => {
        if (err.status === 401) {
          this.exchangeRefresh(() => {
            this.getSpecificUser(nickname);
          });
        }
      },
    });
  }

  onShowDeleteModal(nickname: string): void {
    this.modalService.confirm({
      nzTitle: 'Внимание',
      nzContent: `<b style="color: red;">Вы точно хотите удалить пользователя ${nickname}?</b>`,
      nzOkText: 'Да',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.onDelete(nickname),
      nzCancelText: 'Нет',
      nzOnCancel: () => console.log('Cancel'),
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
            `Роль пользователя ${item.nickname} успешно обновлён`,
          );
        },
        error: (err) => {
          if (err.status === 401) {
            this.exchangeRefresh(() => {
              this.confirmUserModal(item);
            });
          }
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
            `Настройки доступности для пользователя ${item.nickname} успешно обновлены`,
          );
        },
      });
  }

  cancelUserModal(item: any): void {
    item.isUserModalVisible = false;
  }

  onDelete(nickname: string): void {
    console.log('delete');
    this.isTableLoading = true;
    this.userService.deleteUser(nickname).subscribe({
      next: () => {
        this.getAllUsers(nickname);
      },
      error: (err) => {
        if (err.status === 401) {
          this.exchangeRefresh(() => {
            this.onDelete(nickname);
          });
        }
      },
    });
  }

  onRoleChange(event: any, role: string): void {
    console.log('event', event, 'role', role);
    this.isRoleChanged = role !== event;

    console.log('onRoleChange', this.isRoleChanged);
  }

  onGenerateSessionId() {
    this.isGenerateLoading = true;
    this.userService.generateSessionId().subscribe({
      next: (res) => {
        this.sessionId = res._id;
        this.isGenerateLoading = false;
      },
      error: (err) => {
        if (err.status === 401) {
          this.exchangeRefresh(() => {
            this.onGenerateSessionId();
          });
        }
      },
    });
  }

  onSessionIdClick(sessionId: string) {
    this.messageService.create('success', `Session ID успешно скопирован!`);
    navigator.clipboard.writeText(sessionId);
  }
}
