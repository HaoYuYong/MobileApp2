import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline, briefcaseOutline, schoolOutline, businessOutline, mailOutline, callOutline, heart, heartOutline, filterOutline, closeOutline } from 'ionicons/icons';
import { EmpfavouriteService } from '../../service/empfavourite.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';

interface Employee {
  uid: string;
  name: string;
  email: string;
  phone: string;
  positions: Array<{ id: number, position: string }>;
  about?: string;
  educations: any[];
  work_experiences: any[];
  skills: any[];
  formattedAbout?: string;
}

@Component({
  selector: 'app-empfavourite',
  standalone: true,
  templateUrl: './empfavourite.component.html',
  styleUrls: ['./empfavourite.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class EmpfavouriteComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedPosition = '';
  positionOptions: string[] = [];
  showFilterModal = false;
  selectedEmployee: Employee | null = null;

  constructor(
    private empfavouriteService: EmpfavouriteService,
    private sanitizer: DomSanitizer,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router
  ) {
    addIcons({ 
      personOutline, 
      briefcaseOutline,
      schoolOutline,
      businessOutline,
      mailOutline,
      callOutline,
      heart,
      heartOutline,
      filterOutline,
      closeOutline
    });
  }

  ngOnInit() {
    this.loadFavourites();
  }

  private getCurrentCompanyUid(): string | null {
    // Check sessionStorage for currentUser object first
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
      try {
        const user = JSON.parse(sessionUser);
        return user.uid || null;
      } catch (e) {
        console.error('Error parsing session user:', e);
      }
    }
    
    // Fallback to direct uid storage
    return localStorage.getItem('user_uid') || 
           sessionStorage.getItem('user_uid') || 
           null;
  }

  private async showLoginAlert() {
    const alert = await this.alertController.create({
      header: 'Login Required',
      message: 'You need to login to view favorite employees.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Login',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, isError: boolean = false) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: isError ? 'danger' : 'success',
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel',
          side: 'end'
        }
      ]
    });
    await toast.present();
  }

  loadFavourites() {
    this.isLoading = true;
    this.errorMessage = '';
    
    const companyUid = this.getCurrentCompanyUid();
    console.log('Loading favorites for company:', companyUid);
    
    if (!companyUid) {
      this.errorMessage = 'Company not logged in';
      this.isLoading = false;
      this.showLoginAlert();
      return;
    }
    
    this.empfavouriteService.getFavouriteEmployees(companyUid).subscribe({
      next: (data: Employee[]) => {
        this.employees = data.map(employee => ({
          ...employee,
          formattedAbout: this.formatAbout(employee.about)
        }));
        this.filteredEmployees = [...this.employees];
        this.extractPositionOptions();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load favourite employees. Please try again later.';
        this.isLoading = false;
        console.error('Error loading favourites:', err);
        this.showToast(this.errorMessage, true);
      }
    });
  }

  async removeFromFavorites() {
    if (!this.selectedEmployee) return;
    
    const companyUid = this.getCurrentCompanyUid();
    if (!companyUid) {
      await this.showLoginAlert();
      return;
    }
    
    try {
      await this.empfavouriteService.toggleEmployeeFavourite(companyUid, this.selectedEmployee.uid).toPromise();
      // Remove from local lists
      this.employees = this.employees.filter(e => e.uid !== this.selectedEmployee?.uid);
      this.filteredEmployees = this.filteredEmployees.filter(e => e.uid !== this.selectedEmployee?.uid);
      
      // Show success toast
      await this.showToast('Employee removed from favorites');
      
      this.selectedEmployee = null;
    } catch (err) {
      console.error('Error removing favorite:', err);
      await this.showToast('Failed to remove from favorites. Please try again.', true);
    }
  }

  formatAbout(about: string | undefined): string {
    if (!about) return '';
    return about.replace(/\n/g, '<br>');
  }

  getSafeHtml(html: string | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }

  extractPositionOptions() {
    const allPositions = new Set<string>();
    this.employees.forEach(employee => {
      employee.positions.forEach((pos) => {
        allPositions.add(pos.position);
      });
    });
    this.positionOptions = Array.from(allPositions).sort();
  }

  applyFilters() {
    this.filteredEmployees = this.employees.filter(employee => {
      const matchesSearch = this.searchTerm === '' || 
        employee.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        employee.positions.some(pos => 
          pos.position.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      
      let matchesPosition = true;
      if (this.selectedPosition) {
        matchesPosition = employee.positions.some(pos => 
          pos.position === this.selectedPosition
        );
      }
      return matchesSearch && matchesPosition;
    });
    this.showFilterModal = false;
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters(); 
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedPosition = '';
    this.selectedEmployee = null;
    this.filteredEmployees = [...this.employees];
    this.showFilterModal = false;
  }

  selectEmployee(employee: Employee) {
    this.selectedEmployee = {
      ...employee,
      formattedAbout: this.formatAbout(employee.about)
    };
  }

  hasPositions(employee: Employee): boolean {
    return !!employee.positions && employee.positions.length > 0;
  }

  hasAbout(employee: Employee): boolean {
    return !!employee.about && employee.about.trim().length > 0;
  }

  hasEducations(employee: Employee): boolean {
    return !!employee.educations && employee.educations.length > 0;
  }

  hasExperiences(employee: Employee): boolean {
    return !!employee.work_experiences && employee.work_experiences.length > 0;
  }

  hasSkills(employee: Employee): boolean {
    return !!employee.skills && employee.skills.length > 0;
  }
}