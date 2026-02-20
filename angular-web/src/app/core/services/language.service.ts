import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'whist_lang';
export type AppLang = 'he' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  constructor(private translate: TranslateService) {}

  /** Call once at app init to restore saved language and apply dir/lang. Returns promise that resolves when ready. */
  init(): Promise<void> {
    const saved = this.getStoredLang();
    this.applyDirectionAndLang(saved);
    return firstValueFrom(this.translate.use(saved)).then(() => undefined);
  }

  getCurrentLang(): AppLang {
    const current = this.translate.currentLang as AppLang;
    return current === 'he' || current === 'en' ? current : 'he';
  }

  setLanguage(lang: AppLang): void {
    this.translate.use(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    this.applyDirectionAndLang(lang);
  }

  getStoredLang(): AppLang {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'he' ? stored : 'he';
  }

  isRtl(): boolean {
    return this.getCurrentLang() === 'he';
  }

  private applyDirectionAndLang(lang: AppLang): void {
    const dir = lang === 'he' ? 'rtl' : 'ltr';
    const html = document.documentElement;
    html.setAttribute('dir', dir);
    html.setAttribute('lang', lang);
  }
}
