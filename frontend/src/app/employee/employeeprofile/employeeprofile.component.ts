import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../service/profile.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { 
  addOutline,
  add,
  briefcaseOutline,
  briefcase,
  closeOutline,
  close,
  chevronDownOutline,
  chevronDown,
  chevronUpOutline,
  chevronUp,
  trashOutline,
  trash,
  addCircleOutline,
  removeCircleOutline,
  createOutline,
  saveOutline,
  schoolOutline,
  school
} from 'ionicons/icons';

@Component({
  selector: 'app-employeeprofile',
  templateUrl: './employeeprofile.component.html',
  styleUrls: ['./employeeprofile.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class EmployeeprofileComponent implements OnInit {

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
  isAboutMeEditMode: boolean = false;
  tempAboutMe: string = '';
  
  // Education properties
  educations: any[] = [];
  isLoadingEducations = false;
  isEditingEducation = false;
  showAddEducationModal = false;
  educationModalData: any = {
    school: '',
    degree: '',
    field_of_study: '',
    description: ''
  };
  currentlyEditingEducationId: number | null = null;
  
  positionOptions = [
    'Engineer', 'Doctor', 'Accounting', 'Marketing', 'Part Timer', 
    'Event Crew', 'Software Engineer', 'Data Analyst', 'Product Manager',
    'UX Designer', 'DevOps Engineer', 'QA Engineer', 'System Administrator',
    'Technical Writer', 'Frontend Developer', 'Backend Developer',
    'Full Stack Developer', 'Mobile Developer', 'Data Scientist',
    'Machine Learning Engineer', 'Cloud Architect', 'Network Engineer',
    'Security Specialist'
  ];

  degreeOptions = [
    { value: 'High School', label: 'High School' },
    { value: 'Bachelor', label: 'Bachelor\'s' },
    { value: 'Master', label: 'Master\'s' },
    { value: 'PhD', label: 'PhD' },
    { value: 'Other', label: 'Other' }
  ];

  constructor(
    private profileService: ProfileService,
    private http: HttpClient,
    private alertController: AlertController
  ) {
    // Register both outline and non-outline versions of icons
    addIcons({
      add,
      'add-outline': addOutline,
      briefcase,
      'briefcase-outline': briefcaseOutline,
      close,
      'close-outline': closeOutline,
      'chevron-down': chevronDown,
      'chevron-down-outline': chevronDownOutline,
      'chevron-up': chevronUp,
      'chevron-up-outline': chevronUpOutline,
      trash,
      'trash-outline': trashOutline,
      'add-circle-outline': addCircleOutline,
      'remove-circle-outline': removeCircleOutline,
      'create-outline': createOutline,
      'save-outline': saveOutline,
      school,
      'school-outline': schoolOutline
    });
  }

  ngOnInit() {
    console.log('Component initialized');
    
    const userData = sessionStorage.getItem('currentUser');
    console.log('User data from session:', userData);
    
    if (userData) {
      const user = JSON.parse(userData);
      console.log('Parsed user data:', user);
      
      // First load the profile
      this.profileService.fetchProfile(user.uid).subscribe({
        next: (profile) => {
          console.log('Profile loaded:', profile);
          this.userProfile = profile;
          this.isLoading = false;
          this.loadJobPositions(user.uid);
          this.loadAboutMe(user.uid);
          this.loadEducations(user.uid);
        },
        error: (err) => {
          console.error('Error loading profile:', err);
          this.errorMessage = 'Failed to load profile';
          this.isLoading = false;
        }
      });
    } else {
      console.error('No user data found in session storage');
      this.errorMessage = 'User not logged in';
      this.isLoading = false;
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // Job position methods
  loadJobPositions(uid: string) {
    console.log('Loading job positions for uid:', uid);
    this.isLoadingPositions = true;
    
    this.http.get(`${this.apiUrl}/api/job-positions/list/?uid=${uid}`).subscribe({
      next: (data: any) => {
        console.log('Job positions loaded:', data);
        this.jobPositions = data;
        this.isLoadingPositions = false;
      },
      error: (error) => {
        console.error('Error loading job positions:', error);
        this.isLoadingPositions = false;
        if (error.status !== 404) {
          this.showAlert('Error', 'Failed to load job positions');
        } else {
          this.jobPositions = [];
        }
      }
    });
  }

  // About Me methods
  loadAboutMe(uid: string) {
    console.log('Loading About Me for uid:', uid);
    this.http.get(`${this.apiUrl}/api/about-me/?uid=${uid}`).subscribe({
      next: (data: any) => {
        console.log('About Me loaded:', data);
        this.aboutMeData = data;
        this.tempAboutMe = data?.about || '';
      },
      error: (error) => {
        console.error('Error loading About Me:', error);
        if (error.status !== 404) {
          this.showAlert('Error', 'Failed to load About Me');
        }
      }
    });
  }

  // Education methods
  loadEducations(uid: string) {
    console.log('Loading educations for uid:', uid);
    this.isLoadingEducations = true;
    
    this.http.get(`${this.apiUrl}/api/educations/user/${uid}/`).subscribe({
      next: (data: any) => {
        console.log('Educations loaded:', data);
        this.educations = data;
        this.isLoadingEducations = false;
      },
      error: (error) => {
        console.error('Error loading educations:', error);
        this.isLoadingEducations = false;
        if (error.status !== 404) {
          this.showAlert('Error', 'Failed to load education history');
        } else {
          this.educations = [];
        }
      }
    });
  }

  // Education modal methods
  openAddEducationModal() {
    this.educationModalData = {
      school: '',
      degree: '',
      field_of_study: '',
      description: ''
    };
    this.showAddEducationModal = true;
  }

  closeAddEducationModal() {
    this.showAddEducationModal = false;
  }

  saveEducation() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
      this.showAlert('Error', 'User not logged in');
      return;
    }

    const user = JSON.parse(userData);
    const formData = {
      uid: user.uid,
      ...this.educationModalData
    };

    // Validate required fields
    if (!formData.school || !formData.degree || !formData.field_of_study) {
      this.showAlert('Error', 'Please fill in all required fields');
      return;
    }

    this.http.post(`${this.apiUrl}/api/educations/add/`, formData).subscribe({
      next: (response: any) => {
        this.showAddEducationModal = false;
        this.loadEducations(user.uid);
        this.showAlert('Success', 'Education added successfully');
      },
      error: (error) => {
        console.error('Error adding education:', error);
        this.showAlert('Error', 'Failed to add education');
      }
    });
  }

  toggleEditEducationMode() {
    this.isEditingEducation = !this.isEditingEducation;
    if (!this.isEditingEducation) {
      this.currentlyEditingEducationId = null;
    }
  }

  editEducation(education: any) {
    this.currentlyEditingEducationId = education.eid;
    this.educationModalData = {
      school: education.school,
      degree: education.degree,
      field_of_study: education.field_of_study,
      description: education.description
    };
    this.showAddEducationModal = true;
  }

  updateEducation() {
    if (!this.currentlyEditingEducationId) return;

    const formData = {
      ...this.educationModalData
    };

    // Validate required fields
    if (!formData.school || !formData.degree || !formData.field_of_study) {
      this.showAlert('Error', 'Please fill in all required fields');
      return;
    }

    this.http.put(`${this.apiUrl}/api/educations/update/${this.currentlyEditingEducationId}/`, formData).subscribe({
      next: (response: any) => {
        this.showAddEducationModal = false;
        this.currentlyEditingEducationId = null;
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
          const user = JSON.parse(userData);
          this.loadEducations(user.uid);
        }
        this.showAlert('Success', 'Education updated successfully');
      },
      error: (error) => {
        console.error('Error updating education:', error);
        this.showAlert('Error', 'Failed to update education');
      }
    });
  }

  async deleteEducation(eid: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this education record?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.http.delete(`${this.apiUrl}/api/educations/delete/${eid}/`).subscribe({
              next: () => {
                const userData = sessionStorage.getItem('currentUser');
                if (userData) {
                  const user = JSON.parse(userData);
                  this.loadEducations(user.uid);
                }
                this.showAlert('Success', 'Education deleted successfully');
              },
              error: (error) => {
                console.error('Error deleting education:', error);
                this.showAlert('Error', 'Failed to delete education');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  enterAboutMeEditMode() {
    this.isAboutMeEditMode = true;
    this.tempAboutMe = this.aboutMeData?.about || '';
  }

  cancelAboutMeEdit() {
    this.isAboutMeEditMode = false;
  }

  hasAboutMeChanges(): boolean {
    return this.tempAboutMe !== (this.aboutMeData?.about || '');
  }

  saveAboutMe() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
      this.showAlert('Error', 'User not logged in');
      return;
    }

    const user = JSON.parse(userData);
    const aboutData = {
      uid: user.uid,
      about: this.tempAboutMe
    };

    this.http.post(`${this.apiUrl}/api/about-me/`, aboutData).subscribe({
      next: (response: any) => {
        this.aboutMeData = response;
        this.isAboutMeEditMode = false;
        this.showAlert('Success', 'About Me updated successfully');
      },
      error: async (error) => {
        console.error('Error saving About Me:', error);
        await this.showAlert('Error', 'Failed to update About Me');
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
    if (!this.selectedPosition) {
      this.showAlert('Error', 'Please select a position');
      return;
    }
    
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
      this.showAlert('Error', 'User not logged in');
      return;
    }

    const user = JSON.parse(userData);
    const positionData = {
      user: user.uid,
      position: this.selectedPosition
    };
    
    this.http.post(`${this.apiUrl}/api/job-positions/`, positionData).subscribe({
      next: (response: any) => {
        this.loadJobPositions(user.uid);
        this.closeAddPositionModal();
      },
      error: async (error) => {
        console.error('Error saving position:', error);
        let errorMessage = 'Failed to save position';
        if (error.error?.error?.includes('already exists')) {
          errorMessage = 'You have already added this position';
        }
        await this.showAlert('Error', errorMessage);
      }
    });
  }

  async deletePosition(positionId: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to remove this position?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.http.delete(`${this.apiUrl}/api/job-positions/delete/${positionId}/`).subscribe({
              next: () => {
                const userData = sessionStorage.getItem('currentUser');
                if (userData) {
                  const user = JSON.parse(userData);
                  this.loadJobPositions(user.uid);
                }
              },
              error: async (error) => {
                console.error('Error deleting position:', error);
                await this.showAlert('Error', 'Failed to delete position');
              }
            });
          }
        }
      ]
    });

    await alert.present();
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