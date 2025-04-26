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
export class EmployeeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/api/employees/`);
  }
}