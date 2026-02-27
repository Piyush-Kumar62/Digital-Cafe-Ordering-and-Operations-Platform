import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly darkModeSubject = new BehaviorSubject<boolean>(false);
  readonly darkMode$ = this.darkModeSubject.asObservable();

  constructor(@Inject(DOCUMENT) private document: Document) {}

  initTheme(): void {
    const storedTheme = localStorage.getItem('cafe_theme') || localStorage.getItem('theme');
    const isDark = storedTheme === 'dark';
    this.applyTheme(isDark, true, true);
  }

  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }

  setTheme(isDark: boolean): void {
    this.applyTheme(isDark, true, true);
  }

  syncFromStorage(): void {
    const storedTheme = localStorage.getItem('cafe_theme') || localStorage.getItem('theme');
    this.applyTheme(storedTheme === 'dark', false, false);
  }

  private applyTheme(isDark: boolean, persist: boolean, emit: boolean): void {
    const root = this.document.documentElement;
    const body = this.document.body;

    root.classList.toggle('dark', isDark);
    root.classList.toggle('dark-mode', isDark);

    body.classList.toggle('dark-theme', isDark);
    body.classList.toggle('light-theme', !isDark);

    if (persist) {
      const value = isDark ? 'dark' : 'light';
      localStorage.setItem('cafe_theme', value);
      localStorage.setItem('theme', value);
    }

    this.darkModeSubject.next(isDark);

    if (emit && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { dark: isDark } }));
    }
  }
}
