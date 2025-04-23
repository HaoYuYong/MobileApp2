import { Component, OnInit } from '@angular/core';
import { JobSeekService } from '../../service/jobseek.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { businessOutline, briefcaseOutline, informationCircleOutline, searchOutline, filterOutline, heartOutline, heart, mailOutline, callOutline } from 'ionicons/icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Company {
  uid: string;
  name: string;
  email: string;
  phone: string;
  positions: Array<{ id: number, position: string }>;
  scope?: string;
  about?: string;
  formattedScope?: string;
  formattedAbout?: string;
}

@Component({
  selector: 'app-jobseek',
  standalone: true,
  templateUrl: './jobseek.component.html',
  styleUrls: ['./jobseek.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class JobseekComponent implements OnInit {
  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  isLoading = true;
  errorMessage = '';
  expandedCompany: string | null = null;
  searchTerm = '';
  selectedPosition = '';
  positionOptions: string[] = [];
  showFilterModal = false;
  selectedCompany: Company | null = null;
  isFavorite = false;

  constructor(
    private jobSeekService: JobSeekService,
    private sanitizer: DomSanitizer
  ) {
    addIcons({ 
      businessOutline, 
      briefcaseOutline,
      informationCircleOutline,
      searchOutline,
      filterOutline,
      heartOutline,
      heart,
      mailOutline,
      callOutline
    });
  }

  ngOnInit() {
    this.loadCompanies();
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  loadCompanies() {
    this.isLoading = true;
    this.errorMessage = '';
    this.jobSeekService.getCompanies().subscribe({
      next: (data: Company[]) => {
        this.companies = data.map(company => ({
          ...company,
          formattedScope: this.formatScope(company.scope),
          formattedAbout: this.formatAbout(company.about)
        }));
        this.filteredCompanies = [...this.companies];
        this.extractPositionOptions();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load companies. Please try again later.';
        this.isLoading = false;
        console.error('Error loading companies:', err);
      }
    });
  }

  formatScope(scope: string | undefined): string {
    if (!scope) return '';
    let formatted = scope.replace(/\n/g, '<br>');
    formatted = formatted.replace(/(\d+\.)/g, '<span class="list-number">$1</span>');
    return formatted;
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
    this.companies.forEach(company => {
      company.positions.forEach((pos) => {
        allPositions.add(pos.position);
      });
    });
    this.positionOptions = Array.from(allPositions).sort();
  }

  applyFilters() {
    this.filteredCompanies = this.companies.filter(company => {
      const matchesSearch = this.searchTerm === '' || 
        company.positions.some(pos => 
          pos.position.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      
      let matchesPosition = true;
      if (this.selectedPosition) {
        matchesPosition = company.positions.some(pos => 
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
    this.selectedCompany = null;
    this.filteredCompanies = [...this.companies];
    this.showFilterModal = false;
  }

  selectCompany(company: Company) {
    this.selectedCompany = {
      ...company,
      formattedScope: this.formatScope(company.scope),
      formattedAbout: this.formatAbout(company.about)
    };
  }

  toggleCompany(uid: string) {
    this.expandedCompany = this.expandedCompany === uid ? null : uid;
  }

  hasPositions(company: Company): boolean {
    return !!company.positions && company.positions.length > 0;
  }

  hasScope(company: Company): boolean {
    return !!company.scope && company.scope.trim().length > 0;
  }

  hasAbout(company: Company): boolean {
    return !!company.about && company.about.trim().length > 0;
  }
}