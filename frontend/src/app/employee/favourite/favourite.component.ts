import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { businessOutline, briefcaseOutline, mailOutline, callOutline, heart, heartOutline, filterOutline, closeOutline,} from 'ionicons/icons';
import { FavouriteService } from '../../service/favourite.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';

interface Company {
  uid: string;
  name: string;
  email: string;
  phone: string;
  positions: Array<{ id: number; position: string }>;
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
  imports: [CommonModule, FormsModule, IonicModule],
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
  isFavorite = true;
  currentPage = 1;
  itemsPerPage = 6;
  paginatedCompanies: Company[] = [];
  totalPages = 1;

  constructor(
    private favouriteService: FavouriteService,
    private sanitizer: DomSanitizer,
    private alertController: AlertController,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({
      businessOutline,
      briefcaseOutline,
      mailOutline,
      callOutline,
      heart,
      heartOutline,
      filterOutline,
      closeOutline,
    });
  }

  ngOnInit() {
    this.loadFavourites();
  }

  isMobileView(): boolean {
    return window.innerWidth <= 768;
  }

  updatePagination() {
    // Recalculate total pages
    this.totalPages = Math.ceil(
      this.filteredCompanies.length / this.itemsPerPage
    );

    // Ensure current page is within valid range
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }

    // Calculate new paginated companies
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCompanies = this.filteredCompanies.slice(
      startIndex,
      endIndex
    );

    // Reset selected company if it's not on current page
    if (
      this.selectedCompany &&
      !this.paginatedCompanies.some((c) => c.uid === this.selectedCompany?.uid)
    ) {
      this.selectedCompany = null;
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

    return (localStorage.getItem('user_uid') ||
            sessionStorage.getItem('user_uid') ||
            null);
  }

  private async showLoginAlert() {
    const alert = await this.alertController.create({
      header: 'Login Required',
      message: 'You need to login to view favorite companies.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Login',
          handler: () => {
            this.router.navigate(['/login']);
          },
        },
      ],
    });
    await alert.present();
  }

  loadFavourites() {
    this.isLoading = true;
    this.errorMessage = '';

    const userUid = this.getCurrentUserUid();

    if (!userUid) {
      this.errorMessage = 'User not logged in';
      this.isLoading = false;
      this.showLoginAlert();
      return;
    }

    this.favouriteService.getFavourites(userUid).subscribe({
      next: (data: Company[]) => {
        this.companies = data.map((company) => ({
          ...company,
          formattedScope: this.formatScope(company.scope),
          formattedAbout: this.formatAbout(company.about),
        }));
        this.filteredCompanies = [...this.companies];
        this.extractPositionOptions();
        this.currentPage = 1;
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load favourite companies. Please try again later.';
        this.isLoading = false;
        console.error('Error loading favourites:', err);
      },
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
      this.companies = this.companies.filter(
        (c) => c.uid !== this.selectedCompany?.uid
      );
      this.filteredCompanies = this.filteredCompanies.filter(
        (c) => c.uid !== this.selectedCompany?.uid
      );

      // Update pagination after removal
      this.updatePagination();

      // Show success toast
      const toast = await this.toastController.create({
        message: 'Company removed from favorites',
        duration: 2000,
        position: 'top',
        color: 'success',
        buttons: [
          {
            icon: 'close-outline',
            role: 'cancel',
          },
        ],
        cssClass: 'top-toast'
      });
      await toast.present();

      this.selectedCompany = null;
    } catch (err) {
      console.error('Error removing favorite:', err);
      const toast = await this.toastController.create({
        message: 'Failed to remove from favorites. Please try again.',
        duration: 2000,
        position: 'bottom',
        color: 'danger',
        buttons: [
          {
            icon: 'close-outline',
            role: 'cancel',
          },
        ],
      });
      await toast.present();
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
    this.companies.forEach((company) => {
      company.positions.forEach((pos) => {
        allPositions.add(pos.position);
      });
    });
    this.positionOptions = Array.from(allPositions).sort();
  }

  applyFilters() {
    this.filteredCompanies = this.companies.filter((company) => {
      const matchesSearch =
        this.searchTerm === '' ||
        company.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        company.positions.some((pos) =>
          pos.position.toLowerCase().includes(this.searchTerm.toLowerCase())
        );

      let matchesPosition = true;
      if (this.selectedPosition) {
        matchesPosition = company.positions.some(
          (pos) => pos.position === this.selectedPosition
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
    this.selectedCompany = null;
    this.filteredCompanies = [...this.companies];
    this.currentPage = 1;
    this.updatePagination();
    this.showFilterModal = false;
  }

  selectCompany(company: Company) {
    this.selectedCompany = {
      ...company,
      formattedScope: this.formatScope(company.scope),
      formattedAbout: this.formatAbout(company.about),
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