import { Component, HostListener, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  userList: any = [];
  userData: any;
  isLoading: boolean = false;
  tabPosition: any = 'left';

  isScreenWidth550: boolean = false;

  constructor(
    private userService: UserService,
    private modal: NzModalService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenWidth();
  }

  private checkScreenWidth(): void {
    this.isScreenWidth550 = window.innerWidth <= 550;
    this.tabPosition = this.isScreenWidth550 ? 'top' : 'left';
  }

  getAllUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        console.log('getAllUsers', res);
        this.userList = res;
      },
    });
  }

  onUserClick(nickname: string): void {
    console.log('click');
    this.isLoading = true;
    this.userService.getSpecificUser(nickname).subscribe({
      next: (res) => {
        this.userData = res;
        this.isLoading = false;
      },
    });
  }

  showUserModal(e: Event, nickname: string): void {
    e.preventDefault();
    e.stopPropagation();

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

  onDelete(nickname: string): void {
    console.log('delete');
    this.userService.deleteUser(nickname).subscribe({
      next: (res) => {
        this.getAllUsers();
      },
    });
  }

  ngOnInit(): void {
    this.checkScreenWidth();
    this.getAllUsers();
  }
}
