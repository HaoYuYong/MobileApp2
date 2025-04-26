import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface Employee {
  uid: string;
  name: string;
  email: string;
  phone: string;
  positions: { id: number, position: string }[];
  about: string;
  educations: any[];
  work_experiences: any[];
  skills: any[];
}

@Injectable({
  providedIn: 'root'
})
export class EmpfavouriteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getFavouriteEmployees(companyUid: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/api/empfavourites/?company_uid=${companyUid}`);
  }

  toggleEmployeeFavourite(companyUid: string, employeeUid: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/empfavourites/toggle/`, {
      company_uid: companyUid,
      employee_uid: employeeUid
    });
  }
}