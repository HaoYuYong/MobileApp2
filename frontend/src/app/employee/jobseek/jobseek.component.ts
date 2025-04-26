import { Component, OnInit } from '@angular/core';
import { JobSeekService } from '../../service/jobseek.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { businessOutline, briefcaseOutline, informationCircleOutline, searchOutline, filterOutline, heartOutline, heart, mailOutline, callOutline, closeOutline } from 'ionicons/icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FavouriteService } from '../../service/favourite.service';
import { Router } from '@angular/router';

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
    private favouriteService: FavouriteService,
    private sanitizer: DomSanitizer,
    private alertController: AlertController,
    private router: Router,
    private toastController: ToastController
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
      callOutline,
      closeOutline
    });
  }

  ngOnInit() {
    this.loadCompanies();
  }

  private getCurrentUserUid(): string | null {
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
      message: 'You need to login to favorite companies.',
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

  async toggleFavorite() {
    if (!this.selectedCompany) return;
    
    const userUid = this.getCurrentUserUid();
    if (!userUid) {
      await this.showLoginAlert();
      return;
    }
    
    try {
      const response = await this.favouriteService.toggleFavourite(userUid, this.selectedCompany.uid).toPromise();
      this.isFavorite = response.status === 'added';
      
      const toast = await this.toastController.create({
        message: this.isFavorite 
          ? 'Company added to favorites' 
          : 'Company removed from favorites',
        duration: 2000,
        position: 'bottom',
        color: 'success',
        buttons: [
          {
            icon: 'close-outline',
            role: 'cancel'
          }
        ]
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

  checkIsFavorite(companyUid: string) {
    const userUid = this.getCurrentUserUid();
    if (!userUid) {
      this.isFavorite = false;
      return;
    }
    
    this.favouriteService.getFavourites(userUid).subscribe({
      next: (favourites) => {
        this.isFavorite = favourites.some(fav => fav.uid === companyUid);
      },
      error: (err) => {
        console.error('Error checking favorites:', err);
        this.isFavorite = false;
      }
    });
  }

  selectCompany(company: Company) {
    this.selectedCompany = {
      ...company,
      formattedScope: this.formatScope(company.scope),
      formattedAbout: this.formatAbout(company.about)
    };
    this.checkIsFavorite(company.uid);
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