import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { CookieConsentComponent } from './shared/components/cookie-consent/cookie-consent.component';
import { WebSocketService } from './core/websocket/websocket.service';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent, CookieConsentComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Digital Café Platform';
  private removeValidationListeners: Array<() => void> = [];

  constructor(
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    try {
      this.initializeTheme();
      this.preloadCriticalImages();
      // this.initializeInlineValidationWarnings(); // Disabled to fix duplicate warnings

      // Clear stale auth state on landing page when the JWT token is gone
      const currentUrl = this.router.url;
      if (
        (currentUrl === '/' || currentUrl === '') &&
        this.authService.currentUserValue &&
        !this.authService.getToken()
      ) {
        this.authService.logout();
      }

      // Defer WebSocket connection to avoid blocking the initial render
      setTimeout(() => {
        if (this.authService.isAuthenticated) {
          try {
            this.webSocketService.connect();
          } catch {
            // Non-critical — app remains functional without WebSocket
          }
        }
      }, 1000);

      // Subscribe to auth changes
      this.authService.currentUser.subscribe((user) => {
        try {
          if (user) {
            if (!this.webSocketService.isConnected()) {
              this.webSocketService.connect();
            }
          } else {
            if (this.webSocketService.isConnected()) {
              this.webSocketService.disconnect();
            }
          }
        } catch {
          // Non-critical — app remains functional without WebSocket
        }
      });
    } catch {
      // Swallow top-level init errors to prevent white-screen on degraded environments
    }
  }

  ngOnDestroy(): void {
    this.removeValidationListeners.forEach((remove) => remove());
    this.removeValidationListeners = [];
  }

  private initializeTheme(): void {
    this.themeService.initTheme();
  }

  private preloadCriticalImages(): void {
    const urls = [
      "/assets/coffee/coffee-scene-nathan-03.jpg",
      "/assets/coffee/coffee-table-pexels.jpg",
      "/assets/cafe/cafe-ambience.jpg",
    ];

    urls.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.setAttribute("fetchpriority", "high");
      img.src = src;
    });
  }

  private initializeInlineValidationWarnings(): void {
    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form || form.tagName !== 'FORM') return;
      form.dataset['dcSubmitted'] = 'true';

      const controls = form.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >('input, select, textarea');
      controls.forEach((control) => this.updateControlWarning(control, true));
    };

    const onInput = (event: Event) => {
      const control = event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | null;
      if (!control) return;
      control.dataset['dcInteracted'] = 'true';
      this.updateControlWarning(control, false, true);
    };

    const onBlur = (event: Event) => {
      const control = event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | null;
      if (!control) return;
      control.dataset['dcInteracted'] = 'true';
      this.updateControlWarning(control, true, false);
    };

    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);
    document.addEventListener('blur', onBlur, true);

    this.removeValidationListeners.push(() =>
      document.removeEventListener('submit', onSubmit, true),
    );
    this.removeValidationListeners.push(() =>
      document.removeEventListener('input', onInput, true),
    );
    this.removeValidationListeners.push(() =>
      document.removeEventListener('change', onInput, true),
    );
    this.removeValidationListeners.push(() =>
      document.removeEventListener('blur', onBlur, true),
    );
  }

  private updateControlWarning(
    control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    forceShow: boolean,
    fromInput: boolean = false,
  ): void {
    if (!this.isSupportedControl(control)) {
      return;
    }

    const form = control.closest('form');
    const submitted = form?.dataset['dcSubmitted'] === 'true';
    const interacted =
      control.dataset['dcInteracted'] === 'true' ||
      control.classList.contains('ng-touched') ||
      control.classList.contains('ng-dirty');

    const shouldEvaluate = forceShow || submitted || interacted;
    const nativeInvalid = this.isNativeInvalid(control);
    const invalid = fromInput ? nativeInvalid : this.isInvalidControl(control, nativeInvalid);

    // During typing, hide warning immediately once native validity is satisfied.
    if (fromInput && !nativeInvalid) {
      this.removeInlineWarning(control);
      control.classList.remove('dc-invalid-field');
      return;
    }

    if (shouldEvaluate && invalid && !this.hasExistingInlineError(control)) {
      this.showInlineWarning(control, this.resolveWarningMessage(control));
      control.classList.add('dc-invalid-field');
      return;
    }

    this.removeInlineWarning(control);
    control.classList.remove('dc-invalid-field');
  }

  private isSupportedControl(
    control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  ): boolean {
    const isReadOnly =
      control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
        ? control.readOnly
        : false;

    if (control.disabled || isReadOnly) {
      return false;
    }
    if (control.type === 'hidden') {
      return false;
    }
    return true;
  }

  private isInvalidControl(
    control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    nativeInvalid?: boolean,
  ): boolean {
    const resolvedNativeInvalid =
      typeof nativeInvalid === 'boolean'
        ? nativeInvalid
        : this.isNativeInvalid(control);
    const angularInvalid = control.classList.contains('ng-invalid');
    return resolvedNativeInvalid || angularInvalid;
  }

  private isNativeInvalid(
    control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  ): boolean {
    return typeof control.checkValidity === 'function' && !control.checkValidity();
  }

  private hasExistingInlineError(
    control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  ): boolean {
    const host =
      control.closest('.form-group, .input-group, .field-row, .pp-f, label, .mb-3') ||
      control.parentElement;
    if (!host) {
      return false;
    }
    return !!host.querySelector(
      '.error-message, .text-red-300, .pp-err, small.error, .field-hint.error',
    );
  }

  private resolveWarningMessage(
    control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  ): string {
    const label = this.resolveFieldLabel(control);
    const value = (control.value || '').trim();
    const required =
      control.hasAttribute('required') || control.getAttribute('aria-required') === 'true';

    const requiredOverride = control.getAttribute('data-error-required');
    const emailOverride = control.getAttribute('data-error-email');
    const patternOverride = control.getAttribute('data-error-pattern');
    const minOverride = control.getAttribute('data-error-minlength');
    const maxOverride = control.getAttribute('data-error-maxlength');
    const genericOverride = control.getAttribute('data-error-generic');

    if (required && value.length === 0) {
      return requiredOverride || `${label} is required.`;
    }

    if ('validity' in control) {
      const validity = control.validity;
      if (validity.typeMismatch && control instanceof HTMLInputElement && control.type === 'email') {
        return emailOverride || `Please enter a valid ${label.toLowerCase()}.`;
      }
      if (validity.patternMismatch) {
        return patternOverride || `Please enter a valid ${label.toLowerCase()}.`;
      }
      if (validity.tooShort && control instanceof HTMLInputElement && control.minLength > 0) {
        return minOverride || `${label} must be at least ${control.minLength} characters.`;
      }
      if (validity.tooLong && control instanceof HTMLInputElement && control.maxLength > 0) {
        return maxOverride || `${label} must be at most ${control.maxLength} characters.`;
      }
    }

    return genericOverride || `Please correct ${label.toLowerCase()}.`;
  }

  private resolveFieldLabel(
    control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  ): string {
    const byAria = control.getAttribute('aria-label')?.trim();
    if (byAria) {
      return byAria;
    }

    const id = control.id?.trim();
    if (id) {
      const explicit = document.querySelector(`label[for="${id}"]`) as HTMLLabelElement | null;
      const explicitText = this.normalizeLabelText(explicit?.textContent || '');
      if (explicitText) {
        return explicitText;
      }
    }

    const wrapping = control.closest('label');
    const wrappingText = this.normalizeLabelText(wrapping?.textContent || '');
    if (wrappingText) {
      return wrappingText;
    }

    const placeholder = control.getAttribute('placeholder')?.trim();
    if (placeholder) {
      return placeholder;
    }

    const name = control.getAttribute('name')?.trim();
    if (name) {
      return name;
    }

    return 'This field';
  }

  private normalizeLabelText(raw: string): string {
    return raw
      .replace(/\s+/g, ' ')
      .replace(/\*/g, '')
      .trim();
  }

  private showInlineWarning(
    control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    message: string,
  ): void {
    const existing = this.findWarningElement(control);
    if (existing) {
      existing.textContent = message;
      return;
    }

    const warning = document.createElement('small');
    warning.className = 'dc-inline-warning';
    warning.textContent = message;

    const anchor = control.closest('.input-group') || control;
    anchor.insertAdjacentElement('afterend', warning);
  }

  private removeInlineWarning(
    control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  ): void {
    const warning = this.findWarningElement(control);
    if (warning) {
      warning.remove();
    }
  }

  private findWarningElement(
    control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  ): HTMLElement | null {
    const anchor = control.closest('.input-group') || control;
    let sibling = anchor.nextElementSibling as HTMLElement | null;
    while (sibling) {
      if (sibling.classList.contains('dc-inline-warning')) {
        return sibling;
      }
      if (sibling.matches('input,select,textarea,.input-group')) {
        break;
      }
      sibling = sibling.nextElementSibling as HTMLElement | null;
    }
    return null;
  }
}
