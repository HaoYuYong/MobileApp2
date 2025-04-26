import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  searchOutline,
  heartOutline,
  personOutline,
  logInOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  userRole: string | null = null;

  constructor() {
    addIcons({
      homeOutline,
      searchOutline,
      heartOutline,
      personOutline,
      logInOutline,
    });
  }

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    const userData = sessionStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      this.isLoggedIn = true;
      this.userRole = user.role;
    } else {
      this.isLoggedIn = false;
      this.userRole = null;
    }
  }

  logout() {
    sessionStorage.removeItem('currentUser');
    this.isLoggedIn = false;
    this.userRole = null;
    window.location.href = '/login'; // Full reload to reset state
  }
}