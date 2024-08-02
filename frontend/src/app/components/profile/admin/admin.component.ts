import { Component, HostListener, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  userList: any = [];
  userSearchList: any = [];
  userData: any;
  isDeleteLoading: boolean = false;
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

  bossList: readonly string[] = [
    'Аркон',
    'Архон',
    'Баксбакуалануксивайе',
    'Воко',
    'Гигантская Тортолла',
    'Денгур Кровавый топор',
    'Деструктор',
    'Древний Энт',
    'Зверомор',
    'Королева Крыс',
    'Пружинка',
    'Тёмный Шаман',
    'Хьюго',
    'Эдвард',
  ];

  eliteList: readonly string[] = [
    'Альфа Самец',
    'Богатый Упырь',
    'Жужелица Тёмная',
    'Золотой Таракан',
    'Кабан Вожак',
    'Королева Термитов',
    'Королевская Терния',
    'Королевский Паук',
    'Лякуша',
    'Мега Ирекс',
    'Пещерный Волк',
    'Пламярык',
    'Прев. пожиратель моземия',
    'Прев. пожиратель элениума',
    'Самка Жужа',
    'Слепоглаз',
    'Советник Остина',
    'Тринадцатый Крыс',
    'Тёмный Оракул',
    'Фараон',
    'Хозяин',
    'Чёрная Вдова',
  ];

  availableBossList: any;
  availableEliteList: any;

  constructor(
    private userService: UserService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenWidth();
  }

  private checkScreenWidth(): void {
    this.isScreenWidth800 = window.innerWidth <= 800;
    this.isScreenWidth550 = window.innerWidth <= 550;
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
          this.message.create('success', `Пользователь ${nickname} удалён`);
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
      (item: any) => item.nickname.indexOf(this.searchValue) !== -1
    );
  }

  onCurrentPageDataChange(listOfCurrentPageData: any): void {
    this.isTableLoading = true;
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.isTableLoading = false;
  }

  onDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.userList, event.previousIndex, event.currentIndex);
  }

  getSpecificUser(nickname: string): void {
    console.log('click');
    this.isUserDataLoading = true;
    this.userService.getSpecificUser(nickname).subscribe({
      next: (res) => {
        this.userData = res;
        console.log('getSpecificUser', res);
        this.availableBossList = this.bossList.filter(
          (item) => !res.unavailableMobs.includes(item)
        );
        this.availableEliteList = this.eliteList.filter(
          (item) => !res.unavailableMobs.includes(item)
        );
        this.isUserDataLoading = false;
      },
    });
  }

  onShowDeleteModal(nickname: string): void {
    this.modal.confirm({
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
        next: (res) => {
          this.message.create(
            'success',
            `Роль пользователя ${item.nickname} успешно обновлён`
          );
        },
      });
    }

    let unavailableBossList = this.bossList.filter(
      (item) => !this.availableBossList.includes(item)
    );
    let unavailableEliteList = this.eliteList.filter(
      (item) => !this.availableEliteList.includes(item)
    );

    this.isTableLoading = true;
    item.isUserModalVisible = false;

    this.userService
      .updateUnavailable(item.nickname, [
        ...unavailableBossList,
        ...unavailableEliteList,
      ])
      .subscribe({
        next: (res) => {
          this.getAllUsers();
          this.message.create(
            'success',
            `Настройки доступности для пользователя ${item.nickname} успешно обновлены`
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
      next: (res) => {
        this.getAllUsers(nickname);
      },
    });
  }

  onRoleChange(event: any, role: string): void {
    console.log('event', event, 'role', role);
    if (role !== event) {
      this.isRoleChanged = true;
    } else {
      this.isRoleChanged = false;
    }

    console.log('onRoleChange', this.isRoleChanged);
  }

  onGenerateSessionId() {
    this.isGenerateLoading = true;
    this.userService.generateSessionId().subscribe({
      next: (res) => {
        this.sessionId = res._id;
        this.isGenerateLoading = false;
      },
    });
  }

  onSessionIdClick(sessionId: string) {
    this.message.create('success', `Session ID успешно скопирован!`);
    navigator.clipboard.writeText(sessionId);
  }

  ngOnInit(): void {
    this.checkScreenWidth();
    this.getAllUsers();
    this.onGenerateSessionId();

    this.userService.currentUser.subscribe({
      next: (res) => {
        this.currentUser = res;
        console.log(this.currentUser);
      },
    });
  }
}
