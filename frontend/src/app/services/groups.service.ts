import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IGroup } from 'src/app/interfaces/group';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private readonly http = inject(HttpClient);

  private readonly GROUPS_API = environment.apiUrl + '/groups';

  createGroup(name: string): Observable<IGroup> {
    const payload = { name };
    return this.http.post<IGroup>(`${this.GROUPS_API}`, payload);
  }

  getGroup(): Observable<IGroup> {
    return this.http.get<IGroup>(`${this.GROUPS_API}`);
  }

  deleteGroup(): Observable<void> {
    return this.http.delete<void>(`${this.GROUPS_API}`);
  }

  generateInviteGroup(): Observable<{ inviteCode: string }> {
    const payload = {};
    return this.http.post<{ inviteCode: string }>(
      `${this.GROUPS_API}/invite`,
      payload,
    );
  }

  joinGroup(inviteCode: string): Observable<IGroup> {
    const payload = { inviteCode };
    return this.http.post<IGroup>(
      `${this.GROUPS_API}/join`,
      payload,
    );
  }

  transferLeaderGroup(newLeaderEmail: string): Observable<IGroup> {
    const payload = { newLeaderEmail };
    return this.http.post<IGroup>(
      `${this.GROUPS_API}/transfer-leader`,
      payload,
    );
  }

  leaveGroup(): Observable<void> {
    const payload = {};
    return this.http.post<void>(`${this.GROUPS_API}/leave`, payload);
  }

  deleteUser(email: string): Observable<void> {
    return this.http.delete<void>(`${this.GROUPS_API}/${email}`);
  }

  updateGroup(canMembersAddMobs: boolean): Observable<IGroup> {
    const payload = { canMembersAddMobs };
    return this.http.patch<IGroup>(`${this.GROUPS_API}`, payload);
  }
}
