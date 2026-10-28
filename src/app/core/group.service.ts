
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface TripGroup {
  id: number;
  name: string;
  joinCode: string;
  createdById: number;
  createdByName: string;
  active: boolean;
  role?: string;
  createdAt: string;
  joinedAt?: string;
}

export interface GroupMemberResponse {
  userId: number;
  name: string;
  role: string;
  sharingEnabled: boolean;
  joinedAt: string | null;
}

export interface GroupDetailsResponse {
  id: number;
  name: string;
  joinCode: string;
  createdById: number;
  createdByName: string;
  active: boolean;
  createdAt: string;
  members: GroupMemberResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly apiUrl = 'http://localhost:8801/api/groups';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private async getHeaders(): Promise<HttpHeaders> {
    const token = await this.authService.getToken();

    if (!token) {
      throw new Error('Your session has expired. Please log in again.');
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  async createGroup(name: string): Promise<TripGroup> {
    const headers = await this.getHeaders();

    return firstValueFrom(
      this.http.post<TripGroup>(
        this.apiUrl,
        { name },
        { headers }
      )
    );
  }

  async joinGroup(joinCode: string): Promise<TripGroup> {
    const headers = await this.getHeaders();

    return firstValueFrom(
      this.http.post<TripGroup>(
        `${this.apiUrl}/join`,
        { joinCode },
        { headers }
      )
    );
  }

  async getMyGroups(): Promise<TripGroup[]> {
    const headers = await this.getHeaders();

    return firstValueFrom(
      this.http.get<TripGroup[]>(
        `${this.apiUrl}/my`,
        { headers }
      )
    );
  }

  // NEW: Fetch a trip and its members.
  async getGroupDetails(
    groupId: number
  ): Promise<GroupDetailsResponse> {
    const headers = await this.getHeaders();

    return firstValueFrom(
      this.http.get<GroupDetailsResponse>(
        `${this.apiUrl}/${groupId}`,
        { headers }
      )
    );
  }




  
async leaveGroup(groupId: number): Promise<void> {
  const headers = await this.getHeaders();

  await firstValueFrom(
    this.http.delete<void>(
      `${this.apiUrl}/${groupId}/members/me`,
      { headers }
    )
  );
}

}
