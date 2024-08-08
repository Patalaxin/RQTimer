import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TimerService } from './services/timer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewChecked {
  title = 'rq-timer-fe';
  showBackground: boolean = false;
  isVisible: boolean = false;

  constructor(
    private router: Router,
    private timerService: TimerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.timerService.headerVisibility.subscribe({
      next: (res) => {
        this.isVisible = res;
      },
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkRoute(event.urlAfterRedirects);
      });
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges(); // Применяем изменения после всех проверок
  }

  checkRoute(url: string) {
    // Проверяем текущий маршрут и задаем значение для showBackground
    this.showBackground = url === '/timer';
  }
}
