import { Component, OnInit, AfterViewInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";
import { ApiService } from "@core/services/api.service";
import { Cafe } from "@shared/models/cafe.model";

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: "./landing.component.html",
  styleUrls: ["./landing.component.scss"],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  featuredCafes: Cafe[] = [];
  loading = true;
  private observer?: IntersectionObserver;

  features = [
    {
      icon: "🍽️",
      title: "Easy Ordering",
      description:
        "Browse menus and order with just a few taps. Simple, fast, and convenient.",
    },
    {
      icon: "📅",
      title: "Table Booking",
      description:
        "Reserve your favorite spot in advance. Never wait in line again.",
    },
    {
      icon: "💳",
      title: "Secure Payments",
      description:
        "Multiple payment options with bank-grade security for your peace of mind.",
    },
    {
      icon: "⚡",
      title: "Real-time Updates",
      description:
        "Track your order status live. Know exactly when your food is ready.",
    },
    {
      icon: "👨‍🍳",
      title: "Chef Dashboard",
      description:
        "Streamlined kitchen operations with real-time order management.",
    },
    {
      icon: "📊",
      title: "Analytics",
      description: "Powerful insights for café owners to grow their business.",
    },
  ];

  howItWorks = [
    {
      step: "1",
      icon: "📝",
      title: "Register & Verify",
      description:
        "Create your account and verify your email to get started securely.",
    },
    {
      step: "2",
      icon: "🏪",
      title: "Select Café & Book",
      description:
        "Browse cafés, check availability, and book your table in advance.",
    },
    {
      step: "3",
      icon: "🍕",
      title: "Pre-Order & Pay",
      description:
        "Choose from the menu, place your order, and pay securely online.",
    },
    {
      step: "4",
      icon: "👨‍🍳",
      title: "Chef Prepares",
      description: "Kitchen receives your order and prepares it fresh and hot.",
    },
    {
      step: "5",
      icon: "✅",
      title: "Waiter Serves",
      description: "Your order is ready and served at your reserved table.",
    },
  ];

  roles = [
    {
      icon: "👤",
      title: "Customer",
      color: "from-blue-500 to-indigo-600",
      features: [
        "Book tables in advance",
        "Pre-order food & beverages",
        "Track order status real-time",
        "Secure online payments",
        "View order history",
      ],
      cta: "Start Ordering",
      route: "/auth/register",
    },
    {
      icon: "🏢",
      title: "Café Owner",
      color: "from-purple-500 to-pink-600",
      features: [
        "Manage multiple cafés",
        "Add & edit menu items",
        "Create staff accounts",
        "View analytics & reports",
        "Configure table layouts",
      ],
      cta: "Manage Café",
      route: "/auth/register",
    },
    {
      icon: "👨‍🍳",
      title: "Chef",
      color: "from-orange-500 to-red-600",
      features: [
        "Real-time order notifications",
        "Update order status",
        "View kitchen queue",
        "Manage preparation time",
        "Coordinate with team",
      ],
      cta: "Join as Chef",
      route: "/auth/register",
    },
    {
      icon: "🍽️",
      title: "Waiter",
      color: "from-green-500 to-teal-600",
      features: [
        "View assigned tables",
        "Check order status",
        "Serve ready orders",
        "Handle customer requests",
        "Update table status",
      ],
      cta: "Join as Waiter",
      route: "/auth/register",
    },
    {
      icon: "⚙️",
      title: "Admin",
      color: "from-gray-700 to-gray-900",
      features: [
        "Platform-wide management",
        "User & role administration",
        "System monitoring",
        "Analytics dashboard",
        "Security & compliance",
      ],
      cta: "Admin Access",
      route: "/auth/login",
    },
  ];

  workflowSteps = [
    {
      status: "Placed",
      icon: "📋",
      color: "#3b82f6",
      description: "Order received",
    },
    {
      status: "Preparing",
      icon: "👨‍🍳",
      color: "#f59e0b",
      description: "Chef cooking",
    },
    {
      status: "Ready",
      icon: "✓",
      color: "#10b981",
      description: "Ready to serve",
    },
    {
      status: "Served",
      icon: "🍽️",
      color: "#8b5cf6",
      description: "Delivered to table",
    },
  ];

  securityFeatures = [
    {
      icon: "🔐",
      title: "JWT Authentication",
      description:
        "Industry-standard token-based authentication for secure sessions.",
    },
    {
      icon: "🛡️",
      title: "Role-Based Access",
      description:
        "Strict access control ensuring users only see what they're authorized for.",
    },
    {
      icon: "✉️",
      title: "Email Verification",
      description:
        "Mandatory email confirmation to prevent unauthorized access.",
    },
    {
      icon: "💳",
      title: "Secure Payments",
      description: "Bank-grade encryption for all payment transactions.",
    },
    {
      icon: "📝",
      title: "Profile Validation",
      description:
        "Required profile completion for enhanced security and personalization.",
    },
    {
      icon: "🔒",
      title: "Data Encryption",
      description:
        "End-to-end encryption protecting your sensitive information.",
    },
  ];

  testimonials = [
    {
      name: "Sarah Johnson",
      role: "Café Owner",
      image: "👩‍💼",
      text: "This platform transformed how we manage orders. Our efficiency increased by 40%!",
    },
    {
      name: "Mike Chen",
      role: "Customer",
      image: "👨",
      text: "Love the ease of ordering! The app is intuitive and the food arrives hot and fresh.",
    },
    {
      name: "Emily Rodriguez",
      role: "Chef",
      image: "👩‍🍳",
      text: "The chef dashboard is a game-changer. I can manage orders seamlessly.",
    },
  ];

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Load fallback data immediately, then try API
    this.featuredCafes = this.getFallbackCafes();
    this.loading = false;
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
      rootMargin: "0px 0px -50px 0px",
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, options);

    // Observe all animatable elements
    const elements = document.querySelectorAll(
      ".feature-card, .cafe-card, .testimonial-card, .section-header, .cta-content, .timeline-step, .role-card, .workflow-step, .security-card",
    );
    elements.forEach((el) => this.observer?.observe(el));
  }

  loadFeaturedCafes(): void {
    // Try to load from API, but fallback data is already showing
    this.apiService.getActiveCafes().subscribe({
      next: (cafes) => {
        if (cafes && cafes.length > 0) {
          this.featuredCafes = cafes.slice(0, 6);
        }
      },
      error: (error) => {
        console.warn(
          "Could not load cafes from API, using fallback data:",
          error,
        );
        // Fallback data already loaded in ngOnInit
      },
    });
  }

  getFallbackCafes(): Cafe[] {
    return [
      {
        id: 1,
        name: "The Morning Brew",
        description: "Artisan coffee and fresh pastries in a cozy atmosphere",
        city: "San Francisco",
        state: "CA",
        rating: 4.8,
        openingTime: "7:00 AM",
        closingTime: "8:00 PM",
        imageUrl:
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
      },
      {
        id: 2,
        name: "Café Delight",
        description: "Specialty drinks and homemade desserts served daily",
        city: "Portland",
        state: "OR",
        rating: 4.6,
        openingTime: "6:30 AM",
        closingTime: "9:00 PM",
        imageUrl:
          "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&h=300&fit=crop",
      },
      {
        id: 3,
        name: "Urban Grind",
        description: "Modern café with locally roasted beans and quick bites",
        city: "Seattle",
        state: "WA",
        rating: 4.9,
        openingTime: "6:00 AM",
        closingTime: "10:00 PM",
        imageUrl:
          "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=400&h=300&fit=crop",
      },
      {
        id: 4,
        name: "Sunset Coffee House",
        description:
          "Relaxing ambiance with organic coffee and healthy options",
        city: "Austin",
        state: "TX",
        rating: 4.7,
        openingTime: "7:30 AM",
        closingTime: "7:00 PM",
        imageUrl:
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop",
      },
      {
        id: 5,
        name: "Bean & Leaf",
        description: "Coffee and tea specialists with gourmet sandwiches",
        city: "Denver",
        state: "CO",
        rating: 4.5,
        openingTime: "6:00 AM",
        closingTime: "8:00 PM",
        imageUrl:
          "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop",
      },
      {
        id: 6,
        name: "The Daily Roast",
        description: "Fresh roasted coffee with breakfast and lunch specials",
        city: "Boston",
        state: "MA",
        rating: 4.8,
        openingTime: "6:30 AM",
        closingTime: "6:00 PM",
        imageUrl:
          "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop",
      },
    ] as Cafe[];
  }

  getCafeImage(cafe: Cafe): string {
    return cafe.imageUrl || "https://via.placeholder.com/400x300?text=Cafe";
  }

  navigateToCafe(cafeId: number): void {
    this.router.navigate(["/customer/cafes", cafeId]);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
