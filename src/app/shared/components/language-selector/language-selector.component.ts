import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Language, LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss',
})
export class LanguageSelectorComponent {
  isOpen = signal(false);

  constructor(private languageService: LanguageService) {}

  get languages() {
    return this.languageService.availableLanguages;
  }

  get currentLanguage(): Language | undefined {
    return this.languageService.getCurrentLanguageObject();
  }

  toggleDropdown(): void {
    this.isOpen.set(!this.isOpen());
  }

  selectLanguage(langCode: string): void {
    this.languageService.setLanguage(langCode);
    this.isOpen.set(false);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }
}
