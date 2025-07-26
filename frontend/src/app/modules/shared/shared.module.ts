import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Import NgZorro modules
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzAlertModule } from 'ng-zorro-antd/alert';

// Add Taiga UI Modules
import { TuiReorderModule } from '@taiga-ui/addon-table';
import { TuiAlertModule, TuiDialogModule, TuiRootModule } from '@taiga-ui/core';
import { NgxOtpInputComponent } from 'ngx-otp-input';
import { TourTuiDropdownModule } from 'ngx-ui-tour-tui-dropdown';

const sharedModules = [
  NgxOtpInputComponent,
  ReactiveFormsModule,
  FormsModule,
  NzFormModule,
  NzInputModule,
  NzButtonModule,
  NzCheckboxModule,
  NzStepsModule,
  NzIconModule,
  NzMessageModule,
  NzSkeletonModule,
  NzTabsModule,
  NzListModule,
  NzStatisticModule,
  NzProgressModule,
  NzSelectModule,
  NzBadgeModule,
  NzModalModule,
  NzPageHeaderModule,
  NzToolTipModule,
  NzTimePickerModule,
  NzDatePickerModule,
  NzPopoverModule,
  NzDropDownModule,
  NzRadioModule,
  NzTagModule,
  NzTimelineModule,
  NzSpaceModule,
  NzInputNumberModule,
  NzPaginationModule,
  NzBackTopModule,
  NzTableModule,
  NzAvatarModule,
  NzSegmentedModule,
  NzSwitchModule,
  NzNotificationModule,
  NzSliderModule,
  NzAlertModule,
  TuiRootModule,
  TuiDialogModule,
  TuiAlertModule,
  TuiReorderModule,
  TourTuiDropdownModule,
];

@NgModule({
  imports: [CommonModule, ...sharedModules],
  exports: [CommonModule, ...sharedModules],
})
export class SharedModule {}
