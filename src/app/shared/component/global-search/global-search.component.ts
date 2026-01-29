/**
 * Global Search Component
 * Modal de recherche globale style Spotlight
 */
import { 
  Component, 
  OnInit, 
  OnDestroy, 
  Input, 
  Output, 
  EventEmitter,
  ElementRef,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SearchService } from '../../../core/services/search.service';
import { 
  SearchResults, 
  SearchIndexState,
  SearchableItem,
  DEFAULT_SEARCH_CONFIG 
} from '../../../core/models/search.model';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss']
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  
  // État de recherche
  query = '';
  results: SearchResults | null = null;
  isSearching = false;
  
  // État de l'index
  indexState: SearchIndexState | null = null;
  
  // Debounce
  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];
  
  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private searchService: SearchService
  ) {}
  
  ngOnInit(): void {
    // S'abonner à l'état de l'index
    this.subscriptions.push(
      this.searchService.indexState$.subscribe(state => {
        this.indexState = state;
        this.cdr.detectChanges();
      })
    );
    
    // Configurer le debounce de recherche
    this.subscriptions.push(
      this.searchSubject.pipe(
        debounceTime(DEFAULT_SEARCH_CONFIG.debounceMs),
        distinctUntilChanged()
      ).subscribe(query => {
        this.performSearch(query);
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  /**
   * Appelé quand la modal s'ouvre
   */
  onOpen(): void {
    // Focus sur l'input après un court délai (animation)
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }
  
  /**
   * Fermer la modal
   */
  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.closed.emit();
    this.resetSearch();
  }
  
  /**
   * Clic sur le backdrop
   */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('search-backdrop')) {
      this.close();
    }
  }
  
  /**
   * Gestion des touches clavier
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }
  
  /**
   * Quand le texte change
   */
  onQueryChange(): void {
    this.searchSubject.next(this.query);
  }
  
  /**
   * Effectuer la recherche
   */
  private performSearch(query: string): void {
    if (!this.searchService.isReady) {
      this.results = null;
      return;
    }
    
    const trimmed = query.trim();
    
    if (trimmed.length < DEFAULT_SEARCH_CONFIG.minQueryLength) {
      this.results = null;
      this.cdr.detectChanges();
      return;
    }
    
    this.isSearching = true;
    this.cdr.detectChanges();
    
    // Recherche synchrone (l'index est en mémoire)
    this.results = this.searchService.search(trimmed);
    this.isSearching = false;
    this.cdr.detectChanges();
  }
  
  /**
   * Réinitialiser la recherche
   */
  resetSearch(): void {
    this.query = '';
    this.results = null;
    this.isSearching = false;
  }
  
  /**
   * Effacer le champ de recherche
   */
  clearQuery(): void {
    this.query = '';
    this.results = null;
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }
  
  /**
   * Naviguer vers une API
   */
  goToApi(item: SearchableItem): void {
    this.close();
    this.router.navigate(['/catalog', item.apiId]);
  }
  
  /**
   * Naviguer vers un endpoint
   */
  goToEndpoint(item: SearchableItem): void {
    this.close();
    // Encoder le path pour l'URL
    const encodedPath = encodeURIComponent(item.path || '');
    const encodedMethod = item.method?.toLowerCase() || '';
    this.router.navigate(['/catalog', item.apiId], {
      queryParams: {
        tab: 'endpoints',
        endpoint: `${encodedMethod}:${encodedPath}`
      }
    });
  }
  
  /**
   * Voir tous les résultats (page dédiée future)
   */
  viewAllResults(): void {
    // Pour l'instant, on garde la modal ouverte
    // Plus tard, on pourrait naviguer vers une page de recherche dédiée
    console.log('View all results for:', this.query);
  }
  
  /**
   * Obtenir la classe CSS pour la méthode HTTP
   */
  getMethodClass(method: string | undefined): string {
    if (!method) return '';
    return `method-${method.toLowerCase()}`;
  }
  
  /**
   * Vérifier si l'index est prêt
   */
  get isIndexReady(): boolean {
    return this.indexState?.status === 'ready';
  }
  
  /**
   * Vérifier si l'indexation est en cours
   */
  get isIndexing(): boolean {
    return this.indexState?.status === 'indexing';
  }
  
  /**
   * Obtenir le message de placeholder
   */
  get placeholderText(): string {
    if (this.isIndexing) {
      return `Indexation en cours (${this.indexState?.progress || 0}%)...`;
    }
    if (!this.isIndexReady) {
      return 'Chargement...';
    }
    return `Rechercher dans ${this.indexState?.apiCount || 0} APIs...`;
  }
  
  /**
   * Vérifier s'il y a des résultats
   */
  get hasResults(): boolean {
    return this.results !== null && this.results.totalCount > 0;
  }
  
  /**
   * Vérifier si on affiche "aucun résultat"
   */
  get showNoResults(): boolean {
    return this.results !== null && 
           this.results.totalCount === 0 && 
           this.query.trim().length >= DEFAULT_SEARCH_CONFIG.minQueryLength;
  }
  
  /**
   * Vérifier si on affiche le message d'accueil
   */
  get showWelcome(): boolean {
    return this.results === null && 
           this.query.trim().length < DEFAULT_SEARCH_CONFIG.minQueryLength &&
           this.isIndexReady;
  }
  
  /**
   * Highlight le texte qui match
   */
  highlightMatch(text: string | undefined, query: string): string {
    if (!text) return '';
    if (!query || query.length < 2) return text;
    
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    let result = text;
    
    for (const term of terms) {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    }
    
    return result;
  }
  
  /**
   * Échapper les caractères spéciaux regex
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Tronquer une description
   */
  truncateDescription(text: string | undefined, maxLength: number = 80): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
}