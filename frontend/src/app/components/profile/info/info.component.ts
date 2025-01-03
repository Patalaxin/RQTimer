import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
})
export class InfoComponent {
  @Input() user: any;

  getUserColor(role: string): any {
    return role == 'Admin' ? 'volcano' : 'lime';
  }
}
