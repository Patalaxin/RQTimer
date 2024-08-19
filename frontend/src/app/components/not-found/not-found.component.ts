import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TimerService } from 'src/app/services/timer.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent {
  private readonly router = inject(Router);
  private readonly timerService = inject(TimerService);

  ngOnInit() {
    this.timerService.headerVisibility = false;
  }

  ngOnDestroy() {
    this.timerService.headerVisibility = true;
  }

  onTimer(): void {
    this.timerService.isLoading = true;
    this.router.navigate(['/timer']);
  }
}
