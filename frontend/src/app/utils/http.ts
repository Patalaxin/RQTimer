// http-utils.ts
import { HttpHeaders } from '@angular/common/http';
import { StorageService } from '../services/storage.service';

export function createHeaders(storageService: StorageService): HttpHeaders {
  const accessToken = storageService.getLocalStorage('token');
  return new HttpHeaders({ 'Content-Type': 'application/json' }).set(
    'Authorization',
    `Bearer ${accessToken}`
  );
}
