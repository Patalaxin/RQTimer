import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BindingService {
  private focusSearchInputSubject = new Subject<void>();
  private clickReloadButtonSubject = new Subject<void>();
  private clickCopyButtonSubject = new Subject<void>();

  focusSearchInput$ = this.focusSearchInputSubject.asObservable();
  clickReloadButton$ = this.clickReloadButtonSubject.asObservable();
  clickCopyButton$ = this.clickCopyButtonSubject.asObservable();

  triggerFocusSearchInput() {
    this.focusSearchInputSubject.next();
  }

  triggerClickReloadButton() {
    this.clickReloadButtonSubject.next();
  }

  triggerClickCopyButton() {
    this.clickCopyButtonSubject.next();
  }
}
