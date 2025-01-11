import { inject, Injectable } from '@angular/core';
import { NOTIFICATION_SUPPORT } from '@shared/tokens';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly isSupport = inject(NOTIFICATION_SUPPORT);

  get permission(): NotificationPermission | undefined {
    return Notification?.permission;
  }

  requestPermissions(): Promise<NotificationPermission> {
    if (!this.isSupport) {
      throw new Error('Notification WebApi is not supported');
    }

    return Notification.requestPermission();
  }

  sendNotification(title: string, options?: NotificationOptions): void {
    if (!this.isSupport) {
      throw new Error('Notification WebApi is not supported');
    }

    new Notification(title, options);
  }
}
