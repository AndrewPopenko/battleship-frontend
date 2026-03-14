import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly STORAGE_KEY = 'battleship-language';

  public readonly availableLanguages: Language[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  constructor(private translate: TranslateService) {
    this.initLanguage();
  }

  private initLanguage(): void {
    // Get saved language or use default
    const savedLang = localStorage.getItem(this.STORAGE_KEY);
    const browserLang = this.translate.getBrowserLang() || 'en';

    // Check if browser language is supported
    const supportedLang = this.availableLanguages.find((lang) => lang.code === browserLang);

    const langToUse = savedLang || (supportedLang ? browserLang : 'en');
    this.setLanguage(langToUse);
  }

  public setLanguage(langCode: string): void {
    if (this.availableLanguages.some((lang) => lang.code === langCode)) {
      this.translate.use(langCode);
      localStorage.setItem(this.STORAGE_KEY, langCode);
    }
  }

  public getCurrentLanguage(): string {
    return this.translate.currentLang || 'en';
  }

  public getCurrentLanguageObject(): Language | undefined {
    return this.availableLanguages.find((lang) => lang.code === this.getCurrentLanguage());
  }
}
