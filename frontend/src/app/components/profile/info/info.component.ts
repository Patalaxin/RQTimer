import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
  standalone: false,
})
export class InfoComponent {
  @Input() user: { nickname: string; email: string; role: string } = {
    nickname: '',
    email: '',
    role: '',
  };

  getUserColor(role: string): string {
    return role == 'Admin' ? 'volcano' : 'lime';
  }
}
