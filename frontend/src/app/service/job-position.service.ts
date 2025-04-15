import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobPositionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get all job positions for a user
  getJobPositions(uid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/job-positions/list/?uid=${uid}`);
  }

  // Add a new job position
  addJobPosition(positionData: {user: string, position: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/job-positions/`, positionData);
  }

  // Delete a job position
  deleteJobPosition(positionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/job-positions/delete/${positionId}/`);
  }
}