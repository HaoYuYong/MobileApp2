import { Component, OnInit } from '@angular/core';
import { CompanyProfileService } from '../../service/companyprofile.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { 
  addOutline,
  briefcaseOutline,
  closeOutline,
  chevronDownOutline,
  chevronUpOutline,
  trashOutline,
  createOutline,
  saveOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-companyprofile',
  templateUrl: './companyprofile.component.html',
  styleUrls: ['./companyprofile.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CompanyprofileComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  userProfile: any = {};
  isLoading = true;
  errorMessage = '';
  isDropdownOpen = false;
  
  // Job position properties
  jobPositions: any[] = [];
  isLoadingPositions = true;
  showAddPositionModal = false;
  selectedPosition: string | null = null;

  // About me properties
  aboutMeData: any = null;
  isAboutMeEditMode = false;
  tempAboutMe = '';

  // Job Scope properties
  isJobScopeEditMode = false;
  tempJobScope = '';
  jobScopeData: any = null;
  
  positionOptions = [
    'Engineer', 'Doctor', 'Accounting', 'Marketing', 'Part Timer', 
    'Event Crew', 'Software Engineer', 'Data Analyst', 'Product Manager',
    'UX Designer', 'DevOps Engineer', 'QA Engineer', 'System Administrator',
    'Technical Writer', 'Frontend Developer', 'Backend Developer',
    'Full Stack Developer', 'Mobile Developer', 'Data Scientist',
    'Machine Learning Engineer', 'Cloud Architect', 'Network Engineer',
    'Security Specialist'
  ];

  constructor(
    private profileService: CompanyProfileService,
    private http: HttpClient,
    private alertController: AlertController
  ) {
    addIcons({
      'add-outline': addOutline,
      'briefcase-outline': briefcaseOutline,
      'close-outline': closeOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-up-outline': chevronUpOutline,
      'trash-outline': trashOutline,
      'create-outline': createOutline,
      'save-outline': saveOutline
    });
  }

  ngOnInit() {
    const userData = sessionStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      this.profileService.fetchProfile(user.uid).subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.isLoading = false;
          this.loadJobPositions(user.uid);
          this.loadAboutMe(user.uid);
          this.loadJobScope(user.uid);
        },
        error: (err) => {
          this.errorMessage = 'Failed to load profile';
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = 'User not logged in';
      this.isLoading = false;
    }
  }

  // Basic Info Methods
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // Job Position Methods
  loadJobPositions(uid: string) {
    this.isLoadingPositions = true;
    this.profileService.fetchJobPositions(uid).subscribe({
      next: (data: any) => {
        this.jobPositions = data;
        this.isLoadingPositions = false;
      },
      error: () => {
        this.isLoadingPositions = false;
        this.jobPositions = [];
      }
    });
  }

  openAddPositionModal() {
    this.selectedPosition = null;
    this.showAddPositionModal = true;
  }

  closeAddPositionModal() {
    this.showAddPositionModal = false;
  }

  savePosition() {
    if (!this.selectedPosition) return;

    const userData = sessionStorage.getItem('currentUser');
    if (!userData) return;

    const user = JSON.parse(userData);
    this.profileService.addJobPosition({
      user: user.uid,
      position: this.selectedPosition
    }).subscribe({
      next: () => {
        this.loadJobPositions(user.uid);
        this.closeAddPositionModal();
      },
      error: async (error) => {
        const message = error.error?.error?.includes('exists') 
          ? 'Position already exists' 
          : 'Failed to save position';
        await this.showAlert('Error', message);
      }
    });
  }

  async deletePosition(positionId: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: () => {
            this.profileService.deleteJobPosition(positionId).subscribe({
              next: () => this.loadJobPositions(
                JSON.parse(sessionStorage.getItem('currentUser')!).uid
              )
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // About Me Methods
  loadAboutMe(uid: string) {
    this.profileService.getAboutMe(uid).subscribe({
      next: (data) => {
        this.aboutMeData = data;
        this.tempAboutMe = data?.about || '';
      }
    });
  }

  enterAboutMeEditMode() {
    this.isAboutMeEditMode = true;
  }

  cancelAboutMeEdit() {
    this.isAboutMeEditMode = false;
  }

  saveAboutMe() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) return;

    const user = JSON.parse(userData);
    this.profileService.saveAboutMe({
      uid: user.uid,
      about: this.tempAboutMe
    }).subscribe({
      next: (res) => {
        this.aboutMeData = res;
        this.isAboutMeEditMode = false;
      }
    });
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  // Job Scope Method
  loadJobScope(uid: string) {
    this.profileService.getJobScope(uid).subscribe({
      next: (data) => {
        this.jobScopeData = data;
        this.tempJobScope = data?.scope || '';
      }
    });
  }
  
  enterJobScopeEditMode() {
    this.isJobScopeEditMode = true;
  }
  
  cancelJobScopeEdit() {
    this.isJobScopeEditMode = false;
  }
  
  saveJobScope() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) return;
  
    const user = JSON.parse(userData);
    this.profileService.saveJobScope({
      uid: user.uid,
      scope: this.tempJobScope
    }).subscribe({
      next: (res) => {
        this.jobScopeData = res;
        this.isJobScopeEditMode = false;
      }
    });
  }
}