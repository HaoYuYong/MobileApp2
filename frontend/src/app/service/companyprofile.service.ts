import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class CompanyProfileService {
  private apiUrl = `${environment.apiUrl}/api`;
  private currentProfileSubject = new BehaviorSubject<any>(null);
  private jobPositionsSubject = new BehaviorSubject<any[]>([]);
  
  currentProfile$ = this.currentProfileSubject.asObservable();
  jobPositions$ = this.jobPositionsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private alertController: AlertController
  ) {}

  fetchProfile(uid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/get_profile/?uid=${uid}`).pipe(
      tap((profile) => {
        this.currentProfileSubject.next(profile);
      }),
      catchError((error) => {
        this.showAlert('Profile Error', 'Failed to load profile data');
        return throwError(() => error);
      })
    );
  }

  fetchJobPositions(uid: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/job-positions/list/?uid=${uid}`).pipe(
      tap((positions) => {
        this.jobPositionsSubject.next(positions);
      }),
      catchError((error) => {
        this.showAlert('Job Positions Error', 'Failed to load job positions');
        return throwError(() => error);
      })
    );
  }

  addJobPosition(positionData: { user: string; position: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/job-positions/`, positionData).pipe(
      tap((newPosition) => {
        const currentPositions = this.jobPositionsSubject.value;
        this.jobPositionsSubject.next([...currentPositions, newPosition]);
      }),
      catchError((error) => {
        this.showAlert('Add Position Error', error.error?.message || 'Failed to add position');
        return throwError(() => error);
      })
    );
  }

  deleteJobPosition(positionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/job-positions/delete/${positionId}/`).pipe(
      tap(() => {
        const updatedPositions = this.jobPositionsSubject.value.filter(
          pos => pos.id !== positionId
        );
        this.jobPositionsSubject.next(updatedPositions);
      }),
      catchError((error) => {
        this.showAlert('Delete Error', 'Failed to delete position');
        return throwError(() => error);
      })
    );
  }

  getAboutMe(uid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/about-me/?uid=${uid}`).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  saveAboutMe(data: { uid: string; about: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/about-me/`, data).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}