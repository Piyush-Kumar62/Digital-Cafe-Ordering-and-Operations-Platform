import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { ApiService } from '@core/services/api.service';
import { Cafe } from '@shared/models/cafe.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  featuredCafes: Cafe[] = [];
  loading = true;
  private observer?: IntersectionObserver;

  features = [
    {
      icon: '🍽️',
      title: 'Easy Ordering',
      description: 'Browse menus and order with just a few taps. Simple, fast, and convenient.',
    },
    {
      icon: '📅',
      title: 'Table Booking',
      description: 'Reserve your favorite spot in advance. Never wait in line again.',
    },
    {
      icon: '💳',
      title: 'Secure Payments',
      description: 'Multiple payment options with bank-grade security for your peace of mind.',
    },
    {
      icon: '⚡',
      title: 'Real-time Updates',
      description: 'Track your order status live. Know exactly when your food is ready.',
    },
    {
      icon: '👨‍🍳',
      title: 'Chef Dashboard',
      description: 'Streamlined kitchen operations with real-time order management.',
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Powerful insights for café owners to grow their business.',
    },
  ];

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Café Owner',
      image: '👩‍💼',
      text: 'This platform transformed how we manage orders. Our efficiency increased by 40%!',
    },
    {
      name: 'Mike Chen',
      role: 'Customer',
      image: '👨',
      text: 'Love the ease of ordering! The app is intuitive and the food arrives hot and fresh.',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Chef',
      image: '👩‍🍳',
      text: 'The chef dashboard is a game-changer. I can manage orders seamlessly.',
    },
  ];

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Make API call optional to not block page rendering
    this.loadFeaturedCafes();
  }

  ngAfterViewInit(): void {
    // Set up intersection observer for scroll animations
    this.setupScrollAnimations();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  setupScrollAnimations(): void {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, options);

    // Observe all animatable elements
    const elements = document.querySelectorAll(
      '.feature-card, .cafe-card, .testimonial-card, .section-header, .cta-content',
    );
    elements.forEach((el) => this.observer?.observe(el));
  }

  loadFeaturedCafes(): void {
    // Set timeout to ensure page renders even if API is slow
    const timeout = setTimeout(() => {
      this.loading = false;
    }, 5000);

    this.apiService.getActiveCafes().subscribe({
      next: (cafes) => {
        clearTimeout(timeout);
        this.featuredCafes = cafes.slice(0, 6);
        this.loading = false;
      },
      error: (error) => {
        clearTimeout(timeout);
        console.warn('Could not load cafes, continuing without them:', error);
        this.featuredCafes = [];
        this.loading = false;
      },
    });
  }

  getCafeImage(cafe: Cafe): string {
    return cafe.imageUrl || 'https://via.placeholder.com/400x300?text=Cafe';
  }

  navigateToCafe(cafeId: number): void {
    this.router.navigate(['/customer/cafes', cafeId]);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
