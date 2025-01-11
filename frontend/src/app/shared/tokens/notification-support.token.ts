import { inject, InjectionToken } from '@angular/core';
import { WINDOW } from '@shared/tokens';

export const NOTIFICATION_SUPPORT = new InjectionToken<boolean>('Notification WebApi', {
  factory: () => 'Notification' in inject(WINDOW)
});
