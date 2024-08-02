import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TimerService } from 'src/app/services/timer.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent {
  constructor(private router: Router, private timerService: TimerService) {}

  onTimer(): void {
    this.timerService.setIsLoading(true);
    this.router.navigate(['/timer']);
  }

  ngOnInit() {
    this.timerService.setHeaderVisibility(false);
  }

  ngOnDestroy() {
    this.timerService.setHeaderVisibility(true);
  }
}
