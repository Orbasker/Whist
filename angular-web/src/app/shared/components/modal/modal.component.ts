import {
  Component,
  EventEmitter,
  Input,
  Output,
  HostListener,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements AfterViewInit {
  @Input() title: string | null = null;
  @Input() titleId = 'modal-title';
  @Input() closeLabel = 'סגור';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Output() close = new EventEmitter<void>();

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    const dialog = this.el.nativeElement.querySelector('[role="dialog"]');
    if (dialog instanceof HTMLElement) {
      dialog.focus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close.emit();
  }

  onBackdropClick() {
    this.close.emit();
  }

  onPanelClick(event: Event) {
    event.stopPropagation();
  }

  onClose() {
    this.close.emit();
  }

  get sizeClass(): string {
    const map: Record<string, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-5xl',
    };
    return map[this.size] ?? 'max-w-md';
  }
}
