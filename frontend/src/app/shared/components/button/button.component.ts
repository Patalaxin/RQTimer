import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TuiButtonModule, TuiButtonOptions, TuiSvgModule } from '@taiga-ui/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [TuiButtonModule, TuiSvgModule, NgIf],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @Input() appearance: TuiButtonOptions['appearance'] | 'green' = 'primary';
  @Input() shape: TuiButtonOptions['shape'] = null;
  @Input() size: TuiButtonOptions['size'] = 's';
  @Input() disabled = false;
  @Input() loading = false
  @Input() iconName: string = '';
  @Input() isIconButton = false;

  @Output() action = new EventEmitter<void>();

  onClick(): void {
    this.action.emit();
  }
}
