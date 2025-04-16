import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
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
  private educationsSubject = new BehaviorSubject<any[]>([]);
  
  // Observable streams
  currentProfile$ = this.currentProfileSubject.asObservable();
  jobPositions$ = this.jobPositionsSubject.asObservable();
  educations$ = this.educationsSubject.asObservable();

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

  // About Me Methods
  getAboutMe(uid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/about-me/?uid=${uid}`).pipe(
      catchError((error) => {
        console.error('Error fetching about me:', error);
        return throwError(() => new Error(error));
      })
    );
  }
  
  saveAboutMe(data: {uid: string, about: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/about-me/`, data).pipe(
      catchError((error) => {
        console.error('Error saving about me:', error);
        return throwError(() => new Error(error));
      })
    );
  }

  // Education Methods
  /**
   * Fetch education records for user
   * @param uid User ID
   */
  getEducations(uid: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/educations/${uid}/`).pipe(
      tap((educations) => {
        this.educationsSubject.next(educations);
      }),
      catchError((error) => {
        console.error('Error fetching educations:', error);
        this.showAlert('Education Error', 'Failed to load education history');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Add new education record
   * @param educationData {uid: string, school: string, degree: string, field_of_study: string, description?: string}
   */
  addEducation(educationData: {
    uid: string,
    school: string,
    degree: string,
    field_of_study: string,
    description?: string
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/educations/`, educationData).pipe(
      tap((newEducation) => {
        const currentEducations = this.educationsSubject.value;
        this.educationsSubject.next([...currentEducations, newEducation]);
      }),
      catchError((error) => {
        console.error('Error adding education:', error);
        this.showAlert('Add Education Error', error.error?.message || 'Failed to add education');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Update existing education record
   * @param eid Education ID
   * @param educationData {school?: string, degree?: string, field_of_study?: string, description?: string}
   */
  updateEducation(eid: number, educationData: {
    school?: string,
    degree?: string,
    field_of_study?: string,
    description?: string
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/educations/${eid}/`, educationData).pipe(
      tap((updatedEducation) => {
        const currentEducations = this.educationsSubject.value;
        const updatedEducations = currentEducations.map(edu => 
          edu.eid === eid ? updatedEducation : edu
        );
        this.educationsSubject.next(updatedEducations);
      }),
      catchError((error) => {
        console.error('Error updating education:', error);
        this.showAlert('Update Error', 'Failed to update education record');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Delete education record
   * @param eid Education ID
   */
  deleteEducation(eid: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/educations/delete/${eid}/`).pipe(
      tap(() => {
        const updatedEducations = this.educationsSubject.value.filter(
          edu => edu.eid !== eid
        );
        this.educationsSubject.next(updatedEducations);
      }),
      catchError((error) => {
        console.error('Error deleting education:', error);
        this.showAlert('Delete Error', 'Failed to delete education record');
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

  // Work Experience Methods
  /**
   * Fetch work experience records for user
   * @param uid User ID
   */
  getWorkExperiences(uid: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/work-experiences/${uid}/`).pipe(
      catchError((error) => {
        console.error('Error fetching work experiences:', error);
        this.showAlert('Work Experience Error', 'Failed to load work experience');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Add new work experience record
   * @param experienceData {uid: string, title: string, description?: string}
   */
  addWorkExperience(experienceData: {
    uid: string,
    title: string,
    description?: string
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/work-experiences/`, experienceData).pipe(
      catchError((error) => {
        console.error('Error adding work experience:', error);
        this.showAlert('Add Experience Error', error.error?.message || 'Failed to add work experience');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Update existing work experience record
   * @param wid Work Experience ID
   * @param experienceData {title?: string, description?: string}
   */
  updateWorkExperience(wid: number, experienceData: {
    title?: string,
    description?: string
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/work-experiences/${wid}/`, experienceData).pipe(
      catchError((error) => {
        console.error('Error updating work experience:', error);
        this.showAlert('Update Error', 'Failed to update work experience');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
   * Delete work experience record
   * @param wid Work Experience ID
   */
  deleteWorkExperience(wid: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/work-experiences/delete/${wid}/`).pipe(
      catchError((error) => {
        console.error('Error deleting work experience:', error);
        this.showAlert('Delete Error', 'Failed to delete work experience');
        return throwError(() => new Error(error));
      })
    );
  }

  /**
 * Fetch skills for user
 * @param uid User ID
 */
getSkills(uid: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/skills/user/${uid}/`).pipe(
    catchError((error) => {
      console.error('Error fetching skills:', error);
      this.showAlert('Skills Error', 'Failed to load skills');
      return throwError(() => new Error(error));
    })
  );
}

/**
 * Add new skill
 * @param skillData {uid: string, skill: string}
 */
addSkill(skillData: {
  uid: string,
  skill: string
}): Observable<any> {
  return this.http.post(`${this.apiUrl}/skills/add/`, skillData).pipe(
    catchError((error) => {
      console.error('Error adding skill:', error);
      this.showAlert('Add Skill Error', error.error?.message || 'Failed to add skill');
      return throwError(() => new Error(error));
    })
  );
}

/**
 * Update existing skill
 * @param sid Skill ID
 * @param skillData {skill: string}
 */
updateSkill(sid: number, skillData: {
  skill: string
}): Observable<any> {
  return this.http.put(`${this.apiUrl}/skills/update/${sid}/`, skillData).pipe(
    catchError((error) => {
      console.error('Error updating skill:', error);
      this.showAlert('Update Error', 'Failed to update skill');
      return throwError(() => new Error(error));
    })
  );
}

/**
 * Delete skill
 * @param sid Skill ID
 */
deleteSkill(sid: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/skills/delete/${sid}/`).pipe(
    catchError((error) => {
      console.error('Error deleting skill:', error);
      this.showAlert('Delete Error', 'Failed to delete skill');
      return throwError(() => new Error(error));
    })
  );
}
}

