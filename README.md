<div align="center">

# ☕ Digital Café Ordering and Operations Platform

**A full-stack cafe management system with real-time order tracking, online payments, and multi-role dashboards**

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.10-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment-002970?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📖 About

Digital Café is an enterprise-grade platform that digitizes the entire café experience — from table booking and menu browsing to order placement and Razorpay payments. It serves **5 distinct user roles**, each with a dedicated dashboard and real-time WebSocket notifications for live order tracking.

---

## 📸 Screenshots

### Landing Page
<!-- Replace with your actual screenshot -->
![Landing Page](docs/screenshots/landing.png)

### Login & Registration
<!-- Replace with your actual screenshot -->
![Login Page](docs/screenshots/login.png)
![Registration Page](docs/screenshots/register.png)

### Customer Dashboard
<!-- Replace with your actual screenshot -->
![Customer Dashboard](docs/screenshots/customer-dashboard.png)

### Menu Browsing & Ordering
<!-- Replace with your actual screenshot -->
![Menu Page](docs/screenshots/menu.png)
![Order Placement](docs/screenshots/order-placement.png)

### Table Booking
<!-- Replace with your actual screenshot -->
![Table Booking](docs/screenshots/booking.png)

### Razorpay Payment
<!-- Replace with your actual screenshot -->
![Payment Page](docs/screenshots/payment.png)

### Real-Time Order Tracking
<!-- Replace with your actual screenshot -->
![Order Tracking](docs/screenshots/order-tracking.png)

### Chef Dashboard
<!-- Replace with your actual screenshot -->
![Chef Dashboard](docs/screenshots/chef-dashboard.png)

### Waiter Dashboard
<!-- Replace with your actual screenshot -->
![Waiter Dashboard](docs/screenshots/waiter-dashboard.png)

### Café Owner Dashboard
<!-- Replace with your actual screenshot -->
![Cafe Owner Dashboard](docs/screenshots/owner-dashboard.png)

### Admin Dashboard
<!-- Replace with your actual screenshot -->
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

> 💡 **To add screenshots:** Create a `docs/screenshots/` folder in the project root and save your screenshots there with the filenames shown above. They will automatically display here.

---

## ✨ Features

### 👤 Customer
- Browse active cafés and menus with category filtering
- Book tables with date/time slot selection and conflict detection
- Place orders linked to bookings with itemized pricing
- Pay online via **Razorpay** (UPI, Card, Net Banking, Wallet)
- Track orders in real-time via **WebSocket** push notifications
- Multi-section profile with address, academic info, and work experience

### 🍳 Chef
- View incoming paid orders for assigned café
- Update order status: **PREPARING → READY**
- Real-time dashboard with WebSocket-powered auto-refresh

### 🍽️ Waiter
- View ready orders for assigned café
- Mark orders as **SERVED** to complete the lifecycle
- Instant notifications when chef marks orders as ready

### 🏪 Café Owner
- Manage café details, menu items, and tables
- Register and manage staff (Chef, Waiter)
- View café-specific orders and analytics

### 🔑 Admin
- Platform-wide user management with approval workflows
- Manage all cafés across the platform
- Analytics dashboard with aggregate statistics
- Register café owners with auto-generated credential emails

### 🔐 Security & Auth
- JWT authentication with access tokens (24h) and refresh tokens (7d)
- Email verification via Gmail SMTP with token-based links
- Password reset flow with secure time-limited tokens
- Role-based access control at URL and method level (`@PreAuthorize`)
- BCrypt password hashing
- 4 Angular route guards (Auth, Role, Email Verification, Profile Completion)

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| **Spring Boot 3.5.10** | REST API framework |
| **Spring Security 6** | Authentication & authorization |
| **Spring Data JPA** | Database access (Hibernate ORM) |
| **Spring WebSocket** | Real-time STOMP messaging with SockJS |
| **Spring Mail** | Email verification & notifications |
| **MySQL 8.0** | Relational database |
| **JWT (jjwt 0.12.6)** | Stateless token authentication |
| **MapStruct** | Entity ↔ DTO mapping |
| **Razorpay Java SDK** | Payment gateway integration |
| **Lombok** | Boilerplate code reduction |
| **Springdoc OpenAPI** | Swagger API documentation |
| **Maven** | Build & dependency management |

### Frontend

| Technology | Purpose |
|-----------|---------|
| **Angular 20** | SPA framework |
| **TypeScript** | Type-safe JavaScript |
| **PrimeNG** | UI component library |
| **Tailwind CSS** | Utility-first styling |
| **Chart.js** | Analytics & dashboard charts |
| **STOMP.js + SockJS** | WebSocket client for real-time updates |
| **RxJS** | Reactive state management |
| **Angular CDK** | Accessibility & layout utilities |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Angular 20 SPA                       │
│   Admin | Owner | Customer | Chef | Waiter          │
│   AuthGuard · RoleGuard · AuthInterceptor           │
└────────────────────┬────────────────────────────────┘
                     │ HTTP REST + WebSocket (STOMP)
                     ▼
┌─────────────────────────────────────────────────────┐
│              Spring Boot 3.5.10                      │
│  ┌────────────┐  ┌───────────────────────────────┐  │
│  │  Security  │  │     12 REST Controllers       │  │
│  │ JWT Filter │──│  80+ endpoints with RBAC      │  │
│  └────────────┘  └──────────────┬────────────────┘  │
│                                 │                    │
│  ┌──────────────────────────────▼─────────────────┐ │
│  │        11 Service Implementations              │ │
│  └──────────────────────────────┬─────────────────┘ │
│                                 │                    │
│  ┌──────────────────────────────▼─────────────────┐ │
│  │          15 JPA Repositories                   │ │
│  └──────────────────────────────┬─────────────────┘ │
└─────────────────────────────────┼───────────────────┘
                                  │ JPA / Hibernate
                                  ▼
┌─────────────────────────────────────────────────────┐
│   MySQL 8.0 (16 tables) │ Razorpay API │ Gmail SMTP│
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Order Lifecycle

```
  ╔══════════╗        ╔════════════╗        ╔═════════╗        ╔══════════╗
  ║ PENDING  ║──────▶ ║ PREPARING  ║──────▶ ║  READY  ║──────▶ ║  SERVED  ║
  ╚════╤═════╝ Pay    ╚════════════╝ Chef   ╚═════════╝Waiter  ╚══════════╝
       │
       ▼
  ╔════════════╗
  ║ CANCELLED  ║  (Customer can cancel before SERVED)
  ╚════════════╝
```

Each status transition triggers a **WebSocket notification** to the relevant dashboard in real-time.

---

## 📊 Database Schema

**16 tables** with JPA-managed relationships:

| Table | Description |
|-------|-------------|
| `users` | User accounts with BCrypt-hashed passwords |
| `roles` | 5 roles: ADMIN, CAFE_OWNER, CHEF, WAITER, CUSTOMER |
| `user_roles` | Many-to-many join table |
| `profiles` | Personal details, phone, DOB, gender |
| `addresses` | Multi-address support per profile |
| `academic_info` | Education qualifications |
| `work_experiences` | Professional history |
| `cafes` | Café details with owner reference |
| `cafe_tables` | Table inventory per café |
| `menu_items` | Menu catalog with pricing and category |
| `bookings` | Table reservations with conflict detection |
| `orders` | Order header with status tracking |
| `order_items` | Individual items per order |
| `payments` | Razorpay transaction records |
| `email_verification_tokens` | Email verification links |
| `password_reset_tokens` | Password reset links |

---

## 📡 API Overview

**80+ REST endpoints** across 12 controllers, all secured with JWT and role-based access.

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login with email/password → JWT tokens |
| POST | `/simple-register` | Quick customer registration |
| POST | `/register` | Full multi-step registration |
| POST | `/refresh-token` | Refresh expired access token |
| GET | `/verify-email` | Verify email via token link |
| POST | `/forgot-password` | Request password reset email |
| POST | `/reset-password` | Reset password with token |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users (paginated) |
| POST | `/register-cafe-owner` | Register café owner + send credentials |
| PUT | `/users/{id}/status` | Activate/deactivate user |
| GET | `/dashboard` | Platform analytics summary |
| GET | `/dashboard/stats` | Platform-wide analytics |

### Café & Menu (`/api/cafes`, `/api/menu-items`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cafes/active` | List active cafés (public) |
| POST | `/cafes` | Create new café (CAFE_OWNER) |
| CRUD | `/menu-items/**` | Full menu management |
| GET | `/menu-items/cafe/{cafeId}` | Get menu for a café |

### Orders & Payments (`/api/orders`, `/api/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Place new order (CUSTOMER) |
| PUT | `/orders/{id}/prepare` | Mark preparing (CHEF) |
| PUT | `/orders/{id}/ready` | Mark ready (CHEF) |
| PUT | `/orders/{id}/served` | Mark served (WAITER) |
| POST | `/payments/initiate` | Create Razorpay order |
| POST | `/payments/verify` | Verify payment signature |

### Other Controllers
- **BookingController** — Table reservation with time-slot conflict detection
- **TableController** — CRUD for café tables with availability checks
- **StaffController** — Staff registration and management (Chef, Waiter)
- **ProfileController** — Multi-section profile with completion tracking
- **HealthController** — Application health check endpoint

---

## 🚀 Quick Setup

### Prerequisites

- **Java 21** (JDK)
- **Node.js 18+** and npm
- **MySQL 8.0+**
- **Maven 3.9+** (or use the included Maven wrapper)

### 1. Clone the Repository

```bash
git clone https://github.com/Piyush-Kumar62/Digital-Cafe-Ordering-and-Operations-Platform.git
cd Digital-Cafe-Ordering-and-Operations-Platform
```

### 2. Backend Setup

```bash
cd digital-cafe-backend
```

Create a `.env` file or set these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_PASSWORD` | ✅ | MySQL root password |
| `JWT_SECRET` | ✅ | JWT signing key (min 256-bit string) |
| `MAIL_USERNAME` | ✅ | Gmail address for sending emails |
| `MAIL_APP_PASSWORD` | ✅ | Gmail App Password ([how to generate](https://support.google.com/mail/answer/185833)) |
| `RAZORPAY_KEY_ID` | ❌ | Razorpay API key (optional — TEST mode works without it) |
| `RAZORPAY_KEY_SECRET` | ❌ | Razorpay secret key |
| `DB_USERNAME` | ❌ | MySQL username (default: `root`) |
| `DB_URL` | ❌ | JDBC URL (default: `jdbc:mysql://localhost:3306/digital_cafe_db`) |

```bash
# Start the backend (database auto-creates on first run)
./mvnw spring-boot:run
```

> Backend runs at **http://localhost:8080**

### 3. Frontend Setup

```bash
cd digital-cafe-frontend
npm install
ng serve
```

> Frontend runs at **http://localhost:4200**

### 4. Default Admin Login

| Field | Value |
|-------|-------|
| Email | `admin@digitalcafe.com` |
| Password | `Admin@123` |

> The admin account and all 5 roles are auto-created by `DataInitializationConfig.java` on first startup.

## 📚 Engineering Docs

- [ER Diagram](docs/ER_DIAGRAM.md)
- [Architecture Diagram](docs/ARCHITECTURE_DIAGRAM.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Module Documentation](docs/MODULE_DOCUMENTATION.md)

## 🔁 Project Workflow

1. Register and verify email.
2. Complete profile.
3. Book a table.
4. Place an order linked to booking.
5. Complete payment.
6. Chef marks `PREPARING -> READY`.
7. Waiter marks `READY -> SERVED`.

---

## 📁 Project Structure

```
Digital-Cafe-Ordering-and-Operations-Platform/
├── digital-cafe-backend/               # Spring Boot application
│   └── src/main/java/com/digitalcafe/
│       ├── config/                     # Security, WebSocket, CORS, DataInit
│       ├── controller/                 # 12 REST controllers
│       ├── dto/                        # 50+ Request/Response DTOs
│       ├── entity/                     # 16 JPA entities
│       ├── exception/                  # Global exception handler + 6 custom exceptions
│       ├── mapper/                     # MapStruct entity-DTO mappers
│       ├── repository/                 # 15 JPA repositories
│       ├── security/                   # JWT filter, UserDetailsService, JwtUtil
│       └── service/                    # 11 service interfaces + implementations
│
├── digital-cafe-frontend/              # Angular 20 application
│   └── src/app/
│       ├── core/                       # Guards, interceptors, services
│       ├── features/                   # Lazy-loaded feature modules
│       │   ├── admin/                  # Admin dashboard & management
│       │   ├── cafe-owner/             # Owner dashboard & operations
│       │   ├── chef/                   # Chef order queue
│       │   ├── waiter/                 # Waiter service queue
│       │   ├── customer/              # Customer booking, ordering, payments
│       │   ├── auth/                   # Login, register, verification
│       │   └── landing/               # Public landing page
│       └── shared/                     # Models, pipes, shared components
│
└── docs/screenshots/                   # App screenshots for README
```

---

## 🧩 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Stateless JWT** (no sessions) | Scalable — no server-side session storage needed |
| **Interface + Impl** for services | Loose coupling, testability, proxy support for `@Transactional` |
| **Constructor injection** everywhere | Immutable dependencies, compile-time safety |
| **DTOs for all API communication** | Prevents entity exposure, provides stable API contract |
| **Global exception handler** | Consistent error JSON responses across 80+ endpoints |
| **Lazy-loaded Angular routes** | Faster initial load, code splitting per role |
| **Strategy pattern** for payments | Swap Razorpay / Test gateway without code changes |
| **WebSocket (STOMP + SockJS)** | Real-time order status updates without polling |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m "Add amazing feature"`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 👤 Author

**Piyush Kumar** — [@Piyush-Kumar62](https://github.com/Piyush-Kumar62)

📧 piyushkumar30066@gmail.com

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ If you found this project helpful, please give it a star!**

</div>
