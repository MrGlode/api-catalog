/**
 * Register Component
 * Formulaire d'inscription des nouveaux utilisateurs
 */
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegistrationService, RegistrationData } from '../../../app/core/services/registration.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegisterComponent implements OnInit {
  
  // Formulaire
  formData = signal<RegistrationData>({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    organization: '',
    phone: '',
    country: ''
  });
  
  passwordConfirm = signal('');
  
  // États
  isLoading = signal(false);
  isCheckingUsername = signal(false);
  usernameAvailable = signal<boolean | null>(null);
  showPassword = signal(false);
  showPasswordConfirm = signal(false);
  
  // Messages
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  // Règles password
  passwordRules: any;
  
  // Subject pour debounce
  private usernameCheck$ = new Subject<string>();
  
  // Validations
  isUsernameValid = computed(() => {
    const data = this.formData();
    return data.username.length >= 3 && this.usernameAvailable() === true;
  });
  
  isPasswordValid = computed(() => {
    return this.registrationService.isValidPassword(this.formData().password);
  });
  
  isPasswordMatch = computed(() => {
    return this.formData().password === this.passwordConfirm() && this.passwordConfirm().length > 0;
  });
  
  isFormValid = computed(() => {
    const data = this.formData();
    return (
      this.isUsernameValid() &&
      this.isPasswordValid() &&
      this.isPasswordMatch() &&
      data.firstName.length >= 2 &&
      data.lastName.length >= 2 &&
      this.registrationService.isValidEmail(data.email)
    );
  });

  constructor(
    private router: Router,
    private registrationService: RegistrationService
  ) {
    this.passwordRules = this.registrationService.getPasswordRules();
  }

  ngOnInit(): void {
    // Username check avec debounce
    this.usernameCheck$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(username => {
        if (username.length < 3) {
          this.usernameAvailable.set(null);
          this.isCheckingUsername.set(false);
          return of(null);
        }
        this.isCheckingUsername.set(true);
        return this.registrationService.isUsernameAvailable(username);
      })
    ).subscribe({
      next: (available) => {
        if (available !== null) {
          this.usernameAvailable.set(available);
        }
        this.isCheckingUsername.set(false);
      },
      error: () => {
        this.usernameAvailable.set(null);
        this.isCheckingUsername.set(false);
      }
    });
  }

  /**
   * Mettre à jour un champ
   */
  updateField(field: keyof RegistrationData, value: string): void {
    this.formData.update(current => ({ ...current, [field]: value }));
    
    if (field === 'username') {
      this.usernameAvailable.set(null);
      this.usernameCheck$.next(value);
    }
  }

  /**
   * Vérifier une règle de password
   */
  isRuleValid(rule: { test: (pwd: string) => boolean }): boolean {
    return rule.test(this.formData().password);
  }

  /**
   * Toggle password visibility
   */
  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  togglePasswordConfirm(): void {
    this.showPasswordConfirm.update(v => !v);
  }

  /**
   * Soumettre le formulaire
   */
  submit(): void {
    if (!this.isFormValid()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.registrationService.register(this.formData()).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        
        if (response.success) {
          this.successMessage.set('Votre compte a été créé avec succès !');
          setTimeout(() => {
            this.router.navigate(['/login'], { 
              queryParams: { registered: 'true', username: this.formData().username }
            });
          }, 2000);
        } else {
          this.errorMessage.set(response.error || 'Une erreur est survenue');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        
        if (error.status === 409) {
          this.errorMessage.set('Ce nom d\'utilisateur existe déjà');
        } else if (error.status === 400) {
          this.errorMessage.set(error.error?.error || 'Données invalides');
        } else if (error.status === 503) {
          this.errorMessage.set('Service temporairement indisponible');
        } else {
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
        }
      }
    });
  }
}