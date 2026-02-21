import { Component, ElementRef, HostListener } from '@angular/core';
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
  expanded = false;

  constructor(
    public language: LanguageService,
    private el: ElementRef<HTMLElement>
  ) {}

  get currentLang(): AppLang {
    return this.language.getCurrentLang();
  }

  toggle(): void {
    this.expanded = !this.expanded;
  }

  setHebrew(): void {
    this.language.setLanguage('he');
    this.expanded = false;
  }

  setEnglish(): void {
    this.language.setLanguage('en');
    this.expanded = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node;
    if (this.expanded && target && !this.el.nativeElement.contains(target)) {
      this.expanded = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.expanded) {
      this.expanded = false;
    }
  }
}
