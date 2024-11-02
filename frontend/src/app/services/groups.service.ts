import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private readonly http = inject(HttpClient);

  private readonly GROUPS_API = environment.apiUrl + '/groups';

  createGroup(name: string): Observable<any> {
    const payload = { name };
    return this.http.post(`${this.GROUPS_API}`, payload);
  }

  getGroup(): Observable<any> {
    return this.http.get(`${this.GROUPS_API}`);
  }

  deleteGroup(): Observable<any> {
    return this.http.delete(`${this.GROUPS_API}`);
  }

  generateInviteGroup(): Observable<any> {
    const payload = {};
    return this.http.post(`${this.GROUPS_API}/invite`, payload);
  }

  joinGroup(inviteCode: string): Observable<any> {
    const payload = { inviteCode };
    return this.http.post(`${this.GROUPS_API}/join`, payload);
  }

  transferLeaderGroup(newLeaderEmail: string) {
    const payload = { newLeaderEmail };
    return this.http.post(`${this.GROUPS_API}/transfer-leader`, payload);
  }

  leaveGroup(): Observable<any> {
    const payload = {};
    return this.http.post(`${this.GROUPS_API}/leave`, payload);
  }

  deleteUser(email: string): Observable<any> {
    return this.http.delete(`${this.GROUPS_API}/${email}`);
  }
}
