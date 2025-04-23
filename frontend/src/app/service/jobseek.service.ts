import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface Company {
  uid: string;
  name: string;
  email: string;
  phone: string;
  positions: { id: number, position: string }[];
  scope: string;
  about: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobSeekService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.apiUrl}/api/companies/`);
  }
}