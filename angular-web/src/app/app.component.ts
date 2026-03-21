import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SplashComponent } from './features/splash/splash.component';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FooterComponent, SplashComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  showGlobalFooter = true;
  showSplash = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects || e.url)
      )
      .subscribe((url) => {
        // Landing page has its own footer; hide the global one
        this.showGlobalFooter = url !== '/';
      });
  }

  onSplashDismissed(): void {
    this.showSplash = false;
  }
}
