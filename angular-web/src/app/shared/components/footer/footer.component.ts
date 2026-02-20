import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService, AppLang } from '../../../core/services/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  constructor(public language: LanguageService) {}

  get currentLang(): AppLang {
    return this.language.getCurrentLang();
  }

  setHebrew(): void {
    this.language.setLanguage('he');
  }

  setEnglish(): void {
    this.language.setLanguage('en');
  }
}
