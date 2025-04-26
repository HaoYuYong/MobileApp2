import { Component, OnInit } from '@angular/core';
import { EmployeeService } from '../../service/empseek.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline, briefcaseOutline, schoolOutline, businessOutline, mailOutline, callOutline, filterOutline } from 'ionicons/icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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

  constructor(
    private employeeService: EmployeeService,
    private sanitizer: DomSanitizer
  ) {
    addIcons({ 
      personOutline, 
      briefcaseOutline,
      schoolOutline,
      businessOutline,
      mailOutline,
      callOutline,
      filterOutline
    });
  }

  ngOnInit() {
    this.loadEmployees();
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
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load employees. Please try again later.';
        this.isLoading = false;
        console.error('Error loading employees:', err);
      }
    });
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