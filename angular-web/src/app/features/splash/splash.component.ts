import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.scss',
})
export class SplashComponent implements OnInit {
  @Output() dismissed = new EventEmitter<void>();

  fadeOut = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.fadeOut = true;
      setTimeout(() => this.dismissed.emit(), 600);
    }, 2200);
  }
}
