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
export class FavouriteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getFavourites(userUid: string): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.apiUrl}/api/favourites/?user_uid=${userUid}`);
  }

  toggleFavourite(userUid: string, companyUid: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/favourites/toggle/`, {
      user_uid: userUid,
      company_uid: companyUid
    });
  }
}