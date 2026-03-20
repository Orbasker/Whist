import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent implements OnInit {
  loaderType: 'hand' | 'ball' | 'astronaut' = 'hand';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const types: Array<'hand' | 'ball' | 'astronaut'> = ['hand', 'ball', 'astronaut'];
      this.loaderType = types[Math.floor(Math.random() * types.length)];
    }
  }
}
