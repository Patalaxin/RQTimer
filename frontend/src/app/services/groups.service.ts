import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private readonly http = inject(HttpClient);

  private readonly GROUPS_API = environment.apiUrl + '/groups/';

  createGroup(name: string): Observable<any> {
    const payload = { name };
    return this.http.post(`${this.GROUPS_API}`, payload);
  }
}
