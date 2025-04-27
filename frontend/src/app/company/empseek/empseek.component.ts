import { Component, OnInit, HostListener } from '@angular/core';
import { EmployeeService } from '../../service/empseek.service';
import { EmpfavouriteService } from '../../service/empfavourite.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline, briefcaseOutline, schoolOutline, businessOutline, 
         mailOutline, callOutline, filterOutline, heartOutline, heart, 
         closeOutline } from 'ionicons/icons';
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
  selector: 'app-empseek',
  standalone: true,
  templateUrl: './empseek.component.html',
  styleUrls: ['./empseek.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class EmpseekComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedPosition = '';
  positionOptions: string[] = [];
  showFilterModal = false;
  selectedEmployee: Employee | null = null;
  isFavorite = false;
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 6;
  paginatedEmployees: Employee[] = [];
  totalPages = 1;

  constructor(
    private employeeService: EmployeeService,
    private empfavouriteService: EmpfavouriteService,
    private sanitizer: DomSanitizer,
    private alertController: AlertController,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({ 
      personOutline, 
      briefcaseOutline,
      schoolOutline,
      businessOutline,
      mailOutline,
      callOutline,
      filterOutline,
      heartOutline,
      heart,
      closeOutline
    });
  }

  ngOnInit() {
    this.loadEmployees();
    this.setupResponsiveLayout();
  }

  @HostListener('window:resize')
  onResize() {
    this.setupResponsiveLayout();
  }

  private setupResponsiveLayout() {
    if (this.isMobileView() && this.selectedEmployee) {
      // On mobile, if we have a selected employee, ensure details column is hidden
      this.selectedEmployee = null;
    }
  }

  isMobileView(): boolean {
    return window.innerWidth <= 768;
  }

  private getCurrentCompanyUid(): string | null {
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
      try {
        const user = JSON.parse(sessionUser);
        return user.uid || null;
      } catch (e) {
        console.error('Error parsing session user:', e);
      }
    }
    
    return localStorage.getItem('user_uid') || 
           sessionStorage.getItem('user_uid') || 
           null;
  }

  private async showLoginAlert() {
    const alert = await this.alertController.create({
      header: 'Login Required',
      message: 'You need to login to favorite employees.',
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

  loadEmployees() {
    this.isLoading = true;
    this.errorMessage = '';
    this.employeeService.getEmployees().subscribe({
      next: (data: Employee[]) => {
        this.employees = data.map(employee => ({
          ...employee,
          formattedAbout: this.formatAbout(employee.about)
        }));
        this.filteredEmployees = [...this.employees];
        this.extractPositionOptions();
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load employees. Please try again later.';
        this.isLoading = false;
        console.error('Error loading employees:', err);
      }
    });
  }

  async toggleFavorite() {
    if (!this.selectedEmployee) return;
    
    const companyUid = this.getCurrentCompanyUid();
    if (!companyUid) {
      await this.showLoginAlert();
      return;
    }
    
    try {
      const response = await this.empfavouriteService.toggleEmployeeFavourite(
        companyUid, 
        this.selectedEmployee.uid
      ).toPromise();
      
      this.isFavorite = response.status === 'added';
      
      const toast = await this.toastController.create({
        message: this.isFavorite 
          ? 'Employee added to favorites' 
          : 'Employee removed from favorites',
        duration: 2000,
        position: 'top',
        color: 'success',
        buttons: [
          {
            icon: 'close-outline',
            role: 'cancel'
          }
        ],
        cssClass: 'top-toast'
      });
      await toast.present();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      const toast = await this.toastController.create({
        message: 'Failed to update favorite. Please try again.',
        duration: 2000,
        position: 'bottom',
        color: 'danger',
        buttons: [
          {
            icon: 'close-outline',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    }
  }

  selectEmployee(employee: Employee) {
    this.selectedEmployee = {
      ...employee,
      formattedAbout: this.formatAbout(employee.about)
    };
    
    const companyUid = this.getCurrentCompanyUid();
    if (companyUid) {
      this.empfavouriteService.getFavouriteEmployees(companyUid).subscribe({
        next: (favorites) => {
          this.isFavorite = favorites.some(fav => fav.uid === employee.uid);
        },
        error: (err) => {
          console.error('Error checking favorites:', err);
          this.isFavorite = false;
        }
      });
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

    this.currentPage = 1;
    this.updatePagination();
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
    this.currentPage = 1;
    this.updatePagination();
    this.showFilterModal = false;
  }

  // Pagination methods
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEmployees = this.filteredEmployees.slice(startIndex, endIndex);

    // Reset selected employee if it's not on the current page
    if (
      this.selectedEmployee &&
      !this.paginatedEmployees.some(e => e.uid === this.selectedEmployee?.uid)
    ) {
      this.selectedEmployee = null;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
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