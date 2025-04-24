import { Routes } from '@angular/router';
//Employee
import { HomeComponent } from './employee/employeehome/employeehome.component';
import { JobseekComponent } from './employee/jobseek/jobseek.component';
import { FavouriteComponent } from './employee/favourite/favourite.component';
import { EmployeeprofileComponent } from './employee/employeeprofile/employeeprofile.component';
//Company
import { CompanyhomeComponent } from './company/companyhome/companyhome.component';
import { EmpseekComponent } from './company/empseek/empseek.component';
import { PlatformComponent } from './company/platform/platform.component';
import { CompanyprofileComponent } from './company/companyprofile/companyprofile.component';
//General
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { LandingComponent } from './landing/landing.component';

export const appRoutes: Routes = [
  // Default Route
  { path: '', pathMatch: 'full', redirectTo: 'homepage' },

  //Employee
  { path: 'emp-home', component: HomeComponent },
  { path: 'emp-jobseek', component: JobseekComponent },
  { path: 'emp-favourite', component: FavouriteComponent },
  { path: 'emp-profile', component: EmployeeprofileComponent },

  //General
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'homepage', component: LandingComponent },
  
  //Company
  { path: 'comp-home', component: CompanyhomeComponent },
  { path: 'comp-empseek', component: EmpseekComponent },
  { path: 'comp-profile', component: CompanyprofileComponent },
  { path: 'comp-platform', component: PlatformComponent },
];