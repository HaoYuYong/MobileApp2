import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError  } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/api`; // Using environment variable
  private currentProfileSubject = new BehaviorSubject<any>(null);
  private jobPositionsSubject = new BehaviorSubject<any[]>([]);
  
  // Observable streams
  currentProfile$ = this.currentProfileSubject.asObservable();
  jobPositions$ = this.jobPositionsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private alertController: AlertController
  ) {}

  /**
   * Fetch user profile data
   * @param uid User ID
   */
  fetchProfile(uid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/get_profile/?uid=${uid}`).pipe(
      tap((profile) => {
        this.currentProfileSubject.next(profile);
      }),
      catchError((error) => {
        console.error('Error fetching profile:', error);
        this.showAlert('Profile Error', 'Failed to load profile data');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Fetch job positions for user
   * @param uid User ID
   */
  fetchJobPositions(uid: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/job-positions/?uid=${uid}`).pipe(
      tap((positions) => {
        this.jobPositionsSubject.next(positions);
      }),
      catchError((error) => {
        console.error('Error fetching job positions:', error);
        this.showAlert('Job Positions Error', 'Failed to load job positions');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Add a new job position
   * @param positionData {user: string, position: string}
   */
  addJobPosition(positionData: {user: string, position: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/job-positions/`, positionData).pipe(
      tap((newPosition) => {
        const currentPositions = this.jobPositionsSubject.value;
        this.jobPositionsSubject.next([...currentPositions, newPosition]);
      }),
      catchError((error) => {
        console.error('Error adding job position:', error);
        this.showAlert('Add Position Error', error.error?.message || 'Failed to add position');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Delete a job position
   * @param positionId ID of position to delete
   */
  deleteJobPosition(positionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/job-positions/${positionId}/`).pipe(
      tap(() => {
        const updatedPositions = this.jobPositionsSubject.value.filter(
          pos => pos.id !== positionId
        );
        this.jobPositionsSubject.next(updatedPositions);
      }),
      catchError((error) => {
        console.error('Error deleting job position:', error);
        this.showAlert('Delete Error', 'Failed to delete position');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Update user profile
   * @param uid User ID
   * @param profileData Updated profile data
   */
  updateProfile(uid: string, profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile/update/`, {uid, ...profileData}).pipe(
      tap((updatedProfile) => {
        this.currentProfileSubject.next(updatedProfile);
      }),
      catchError((error) => {
        console.error('Error updating profile:', error);
        this.showAlert('Update Error', 'Failed to update profile');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Helper method to show alert messages
   * @param header Alert header
   * @param message Alert message
   */
  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  getAboutMe(uid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/about-me/?uid=${uid}`);
  }
  
  saveAboutMe(data: {uid: string, about: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/about-me/`, data);
  }
}