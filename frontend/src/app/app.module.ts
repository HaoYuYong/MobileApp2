import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { AppComponent } from './app.component';
// import { AppRoutingModule } from './app-routing.module';
import { RouterModule } from '@angular/router';
import { appRoutes } from './app.routes';
// Import your employee components
import { HomeComponent } from './employee/employeehome/employeehome.component';
import { JobseekComponent } from './employee/jobseek/jobseek.component';
import { CreatecvComponent } from './employee/createcv/createcv.component';
import { EmployeeprofileComponent } from './employee/employeeprofile/employeeprofile.component';
//General
import { HeaderComponent } from './header/header.component'; // Import HeaderComponent
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { LandingComponent } from './landing/landing.component';
// Import your company components
import { CompanyhomeComponent } from './company/companyhome/companyhome.component';
import { EmpseekComponent } from './company/empseek/empseek.component';
import { PlatformComponent } from './company/platform/platform.component';
import { CompanyprofileComponent } from './company/companyprofile/companyprofile.component';

// Import Angular Modules
import { FormsModule, ReactiveFormsModule  } from '@angular/forms'; // Add this import

// Import services
import { RegisterService } from './service/register.service';
import { provideHttpClient } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent, 
    HomeComponent,
    JobseekComponent,
    CreatecvComponent,
    EmployeeprofileComponent,
    LoginComponent,
    RegisterComponent,
    CompanyhomeComponent,
    EmpseekComponent,
    PlatformComponent,
    CompanyprofileComponent,
    LandingComponent
  ],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    // AppRoutingModule,
    RouterModule.forRoot(appRoutes),
    FormsModule, // Add FormsModule
    ReactiveFormsModule
    ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Allow Web Components like <ion-button>
  providers: [RegisterService, provideHttpClient()],
  bootstrap: [AppComponent]
})
export class AppModule {}
