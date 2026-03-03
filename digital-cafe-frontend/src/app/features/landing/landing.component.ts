import { Component, OnInit, AfterViewInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";
import { CtaComponent } from "@shared/components/cta/cta.component";
import { ApiService } from "@core/services/api.service";
import { PublicCafeCard } from "@shared/models/cafe.model";
import { CafeBrowseService } from "@features/public/cafe-browse.service";
import { Subject, interval, of } from "rxjs";
import { takeUntil, startWith, switchMap, catchError } from "rxjs/operators";

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FooterComponent,
    CtaComponent,
  ],
  templateUrl: "./landing.component.html",
  styleUrls: ["./landing.component.scss"],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  featuredCafes: PublicCafeCard[] = [];
  loading = true;
  private observer?: IntersectionObserver;
  private destroy$ = new Subject<void>();
  private readonly animatableSelector =
    ".feature-card, .cafe-card, .testimonial-card, .section-header, .timeline-step, .role-card, .workflow-step, .security-card, .faq-item, .metric-box";

  features = [
    {
      icon: "🍽️",
      title: "Easy Online Ordering",
      description:
        "Browse café menus, select your food, and pre-order before you arrive. Skip the wait completely.",
    },
    {
      icon: "📅",
      title: "Table Booking",
      description:
        "Reserve your table for a specific date and time slot. Conflict detection ensures no double-bookings.",
    },
    {
      icon: "💳",
      title: "Razorpay Payments",
      description:
        "Pay securely via UPI, Card, Net Banking, or Wallet. All transactions are encrypted end-to-end.",
    },
    {
      icon: "⚡",
      title: "Real-Time Order Tracking",
      description:
        "WebSocket-powered live order status — watch your order move from Placed → Preparing → Ready → Served.",
    },
    {
      icon: "🏪",
      title: "Café Management",
      description:
        "Café owners manage their profile, tables, menu items, and staff from a dedicated operations dashboard.",
    },
    {
      icon: "👥",
      title: "Multi-Role Platform",
      description:
        "Five distinct roles — Admin, Café Owner, Chef, Waiter, and Customer — each with tailored dashboards.",
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
      route: "/contact",
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
      route: "/contact",
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
      route: "/contact",
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
      title: "Secure Login",
      description:
        "You can safely log in to your account, and no one else can access it without your permission.",
    },
    {
      icon: "🛡️",
      title: "Limited Access for Safety",
      description:
        "Each person can only see and use the features they are allowed to. This prevents misuse.",
    },
    {
      icon: "✉️",
      title: "Email Verification",
      description:
        "We verify your email address to ensure it's really you and to protect your account.",
    },
    {
      icon: "💳",
      title: "Secure Payments",
      description:
        "All payment information is encrypted and processed securely to protect your financial data.",
    },
    {
      icon: "📝",
      title: "Profile Completion",
      description:
        "We require complete profiles to ensure accountability and enhance security for all users.",
    },
    {
      icon: "🔒",
      title: "Data Encryption",
      description:
        "Your personal information is kept private and safe from unauthorized access.",
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

  platformMetrics = [
    { label: "Avg Order Lead-Time Saved", value: "35%" },
    { label: "Role-Based Workflow Coverage", value: "100%" },
    { label: "Real-Time Status Stages", value: "4" },
    { label: "Core Business Modules", value: "8+" },
  ];

  faqs = [
    {
      question: "Who can register from the public registration page?",
      answer:
        "Only Customer can self-register. Café Owner, Chef, and Waiter accounts are created by Admin or Café Owner based on role flow.",
    },
    {
      question: "What should a new customer do first?",
      answer:
        "Start with Register, verify your email, complete your profile, then log in. After login, you can choose a café, book a table, and place your order.",
    },
    {
      question: "Why do I need email verification?",
      answer:
        "Email verification protects your account and confirms that notifications, order updates, and password reset links go to the correct person.",
    },
    {
      question: "How does table booking work?",
      answer:
        "Pick a café, select date and time slot, and choose an available table. The system checks availability in real time to avoid double booking.",
    },
    {
      question: "Can I order food without booking a table?",
      answer:
        "For dine-in flow, booking first is recommended so your order is linked to your table and served faster.",
    },
    {
      question: "How does order status update?",
      answer:
        "Your order moves through clear stages: Pending/Placed, Preparing, Ready, and Served. You can track progress from your dashboard.",
    },
    {
      question: "What if I forget my password?",
      answer:
        "Use Forgot Password on login, enter your email, open the reset link, and set a new password. Then log in again with the new password.",
    },
    {
      question: "Can one platform manage multiple cafés?",
      answer:
        "Yes. The system supports multi-café operations with centralized admin control and role-based dashboards for each actor.",
    },
    {
      question: "Can I modify or cancel my booking after confirmation?",
      answer:
        "Yes. Customers can update or cancel bookings based on café policy and available time windows. Changes are reflected instantly in your dashboard.",
    },
    {
      question: "How do I check my past bookings and orders?",
      answer:
        "Open your customer dashboard and go to booking history or order history. You can view past activity, status, and details for each record.",
    },
  ];
  activeFaqIndex: number | null = 0;

  constructor(
    private apiService: ApiService,
    private cafeBrowseService: CafeBrowseService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Poll every 30s — public endpoint, no auth required
    interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() => {
          this.loading = this.featuredCafes.length === 0; // show spinner only on first load
          return this.cafeBrowseService
            .getPublicCafes(0, 6)
            .pipe(catchError(() => of(null)));
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res && res.content.length > 0) {
          this.featuredCafes = res.content;
        }
        this.loading = false;
        this.observeAnimatableElements();
      });
  }

  ngAfterViewInit(): void {
    // Set up intersection observer for scroll animations
    this.setupScrollAnimations();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.destroy$.next();
    this.destroy$.complete();
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

    this.observeAnimatableElements();
  }

  private observeAnimatableElements(): void {
    // Wait for Angular to paint list content, then observe and reveal.
    requestAnimationFrame(() => {
      const elements = document.querySelectorAll(this.animatableSelector);
      elements.forEach((el) => {
        el.classList.add("animate-in");
        this.observer?.observe(el);
      });
    });
  }

  loadFeaturedCafes(): void {
    // kept for backward-compat; actual polling is in ngOnInit
  }

  getFallbackCafes(): PublicCafeCard[] {
    return [];
  }

  getCafeImage(cafe: PublicCafeCard): string {
    const src = cafe.imageUrl || cafe.logoUrl;
    if (!src) return "/assets/cafe/cafe-interior-01.jpg";
    if (/^https?:\/\//.test(src)) return src;
    return src;
  }

  formatCafeRating(cafe: PublicCafeCard): string {
    const v = Number(cafe.rating);
    return v > 0 ? v.toFixed(1) : "New";
  }

  /** "HH:MM" → "H:MM AM/PM" */
  fmt12h(val: string | undefined | null): string {
    if (!val) return "";
    const m = val.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return val;
    let h = Number(m[1]);
    const min = m[2];
    const meridian = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${min} ${meridian}`;
  }

  navigateToCafe(cafeId: number): void {
    this.router.navigate(["/cafes", cafeId]);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }
}
