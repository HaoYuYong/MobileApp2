import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { businessOutline, briefcaseOutline, mailOutline, callOutline, heart, heartOutline, filterOutline  } from 'ionicons/icons';
import { FavouriteService } from '../../service/favourite.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  selector: 'app-favourite',
  standalone: true,
  templateUrl: './favourite.component.html',
  styleUrls: ['./favourite.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class FavouriteComponent implements OnInit {
  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedPosition = '';
  positionOptions: string[] = [];
  showFilterModal = false;
  selectedCompany: Company | null = null;
  isFavorite = true; // Always true since we're in favorites page

  constructor(
    private favouriteService: FavouriteService,
    private sanitizer: DomSanitizer,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({ 
      businessOutline, 
      briefcaseOutline,
      mailOutline,
      callOutline,
      heart,
      heartOutline,
      filterOutline 
    });
  }

  ngOnInit() {
    this.loadFavourites();
  }

  private getCurrentUserUid(): string | null {
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
      message: 'You need to login to view favorite companies.',
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

  loadFavourites() {
    this.isLoading = true;
    this.errorMessage = '';
    
    const userUid = this.getCurrentUserUid();
    console.log('Loading favorites for user:', userUid); // Debug log
    
    if (!userUid) {
      this.errorMessage = 'User not logged in';
      this.isLoading = false;
      this.showLoginAlert();
      return;
    }
    
    this.favouriteService.getFavourites(userUid).subscribe({
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
        this.errorMessage = 'Failed to load favourite companies. Please try again later.';
        this.isLoading = false;
        console.error('Error loading favourites:', err);
      }
    });
  }

  async removeFromFavorites() {
    if (!this.selectedCompany) return;
    
    const userUid = this.getCurrentUserUid();
    if (!userUid) {
      await this.showLoginAlert();
      return;
    }
    
    try {
      await this.favouriteService.toggleFavourite(userUid, this.selectedCompany.uid).toPromise();
      // Remove from local lists
      this.companies = this.companies.filter(c => c.uid !== this.selectedCompany?.uid);
      this.filteredCompanies = this.filteredCompanies.filter(c => c.uid !== this.selectedCompany?.uid);
      this.selectedCompany = null;
    } catch (err) {
      console.error('Error removing favorite:', err);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to remove from favorites. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
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