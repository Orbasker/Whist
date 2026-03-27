import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './rules.component.html',
  styleUrl: './rules.component.scss',
})
export class RulesComponent {
  sections = [
    { id: 'overview', key: 'rules.sections.overview' },
    { id: 'deal', key: 'rules.sections.deal' },
    { id: 'contracts', key: 'rules.sections.contracts' },
    { id: 'play', key: 'rules.sections.play' },
    { id: 'scoring', key: 'rules.sections.scoring' },
    { id: 'glossary', key: 'rules.sections.glossary' },
  ];

  activeSection = 'overview';

  scrollTo(sectionId: string, event: Event): void {
    event.preventDefault();
    this.activeSection = sectionId;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
